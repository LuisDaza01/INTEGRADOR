import { useTheme } from "../../contexts/ThemeContext"

const SHIMMER_ANIM = `@keyframes skeletonShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`

const Skeleton = ({ width = '100%', height = 16, borderRadius = 8, style = {} }) => {
  const { isDark } = useTheme()
  const from = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'
  const mid  = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.10)'
  return (
    <div style={{
      width, height, borderRadius,
      background: `linear-gradient(90deg, ${from} 25%, ${mid} 50%, ${from} 75%)`,
      backgroundSize: '200% 100%',
      animation: 'skeletonShimmer 1.5s ease-in-out infinite',
      ...style,
    }} />
  )
}

export const SkeletonProductorCard = () => {
  const { D, isDark } = useTheme()
  return (
    <div style={{
      borderRadius: 16, overflow: 'hidden',
      background: isDark ? 'rgba(255,255,255,0.03)' : D.surface,
      border: `1px solid ${D.border}`,
    }}>
      <style>{SHIMMER_ANIM}</style>
      <Skeleton height={192} borderRadius={0} />
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Skeleton width={44} height={44} borderRadius="50%" />
          <div style={{ flex: 1 }}>
            <Skeleton height={14} width="60%" style={{ marginBottom: 6 }} />
            <Skeleton height={11} width="40%" />
          </div>
        </div>
        <Skeleton height={11} style={{ marginBottom: 6 }} />
        <Skeleton height={11} width="75%" style={{ marginBottom: 16 }} />
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <Skeleton height={22} width={80} borderRadius={20} />
          <Skeleton height={22} width={70} borderRadius={20} />
        </div>
        <Skeleton height={1} style={{ marginBottom: 12 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skeleton height={13} width={90} />
          <Skeleton height={13} width={70} />
        </div>
      </div>
    </div>
  )
}

export const SkeletonProductCard = () => {
  const { D, isDark } = useTheme()
  return (
    <div style={{
      borderRadius: 16, overflow: 'hidden', width: 180, flexShrink: 0,
      background: isDark ? 'rgba(255,255,255,0.03)' : D.surface,
      border: `1px solid ${D.border}`,
    }}>
      <style>{SHIMMER_ANIM}</style>
      <Skeleton height={130} borderRadius={0} />
      <div style={{ padding: 12 }}>
        <Skeleton height={13} width="80%" style={{ marginBottom: 6 }} />
        <Skeleton height={11} width="50%" style={{ marginBottom: 10 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton height={16} width={60} />
          <Skeleton width={28} height={28} borderRadius={8} />
        </div>
      </div>
    </div>
  )
}

export const SkeletonStatCard = () => {
  const { D, isDark } = useTheme()
  return (
    <div style={{
      borderRadius: 14, padding: 20,
      background: isDark ? 'rgba(255,255,255,0.03)' : D.surface,
      border: `1px solid ${D.border}`,
    }}>
      <style>{SHIMMER_ANIM}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <Skeleton width={40} height={40} borderRadius={10} />
        <Skeleton width={60} height={22} borderRadius={20} />
      </div>
      <Skeleton height={11} width="60%" style={{ marginBottom: 8 }} />
      <Skeleton height={28} width="50%" />
    </div>
  )
}

export const SkeletonTableRow = () => {
  const { D } = useTheme()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: `1px solid ${D.border}` }}>
      <style>{SHIMMER_ANIM}</style>
      <Skeleton width={36} height={36} borderRadius="50%" />
      <div style={{ flex: 1 }}>
        <Skeleton height={13} width="50%" style={{ marginBottom: 6 }} />
        <Skeleton height={11} width="30%" />
      </div>
      <Skeleton height={24} width={80} borderRadius={12} />
      <Skeleton height={13} width={60} />
    </div>
  )
}

export const SkeletonList = ({ count = 5, Component = SkeletonTableRow }) => (
  <>{Array.from({ length: count }).map((_, i) => <Component key={i} />)}</>
)

export default Skeleton
