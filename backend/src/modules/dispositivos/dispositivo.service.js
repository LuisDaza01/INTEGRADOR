const dispositivoRepository = require('./dispositivo.repository');
const { NotFoundError, ConflictError, ValidationError, BusinessError } = require('../../utils/errors');

// Genera un código tipo "NP-XXXXXX" (6 hex en mayúsculas)
function generarCodigo() {
  const bytes = require('crypto').randomBytes(3).toString('hex').toUpperCase();
  return `NP-${bytes}`;
}

class DispositivoService {
  async listar() {
    return dispositivoRepository.findAll();
  }

  async crear({ codigo, notas } = {}) {
    let codigoFinal = (codigo || '').trim().toUpperCase();
    if (!codigoFinal) {
      // Intenta hasta 5 veces generar uno único
      for (let i = 0; i < 5; i++) {
        const candidato = generarCodigo();
        const existe = await dispositivoRepository.findByCodigo(candidato);
        if (!existe) { codigoFinal = candidato; break; }
      }
      if (!codigoFinal) throw new BusinessError('No se pudo generar un código único, reintenta');
    } else {
      if (codigoFinal.length < 3 || codigoFinal.length > 50) {
        throw new ValidationError('El código debe tener entre 3 y 50 caracteres');
      }
      const existe = await dispositivoRepository.findByCodigo(codigoFinal);
      if (existe) throw new ConflictError('Ya existe un dispositivo con ese código');
    }

    return dispositivoRepository.create({ codigo: codigoFinal, notas });
  }

  async actualizar(id, { notas, activo }) {
    const actual = await dispositivoRepository.findById(id);
    if (!actual) throw new NotFoundError('Dispositivo no encontrado');
    return dispositivoRepository.update(id, { notas, activo });
  }

  async eliminar(id) {
    const actual = await dispositivoRepository.findById(id);
    if (!actual) throw new NotFoundError('Dispositivo no encontrado');
    if (actual.asignado_a_laguna_id) {
      throw new BusinessError('No puedes eliminar un dispositivo asignado. Libéralo primero.');
    }
    return dispositivoRepository.delete(id);
  }

  async liberar(id) {
    const actual = await dispositivoRepository.findById(id);
    if (!actual) throw new NotFoundError('Dispositivo no encontrado');
    return dispositivoRepository.liberar(id);
  }

  // ── usado por laguna.service al vincular ──
  // Devuelve el dispositivo si es válido para `lagunaId`, o lanza error claro.
  async validarParaVinculacion(codigoRaw, lagunaId) {
    const codigo = (codigoRaw || '').trim().toUpperCase();
    if (!codigo) throw new ValidationError('Debes ingresar el código del dispositivo');

    const disp = await dispositivoRepository.findByCodigo(codigo);
    if (!disp) throw new NotFoundError('Ese código no existe. Pídele uno válido al administrador.');
    if (!disp.activo) throw new BusinessError('Este dispositivo está desactivado');
    if (disp.asignado_a_laguna_id && disp.asignado_a_laguna_id !== Number(lagunaId)) {
      throw new ConflictError('Este código ya está vinculado a otra laguna');
    }
    return disp;
  }

  async marcarAsignado(dispId, lagunaId) {
    return dispositivoRepository.marcarAsignado(dispId, lagunaId);
  }
}

module.exports = new DispositivoService();
