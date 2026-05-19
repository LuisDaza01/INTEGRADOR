import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'

export const useInfiniteScroll = (url, { params = {}, pageSize = 9 } = {}) => {
  const [items, setItems]       = useState([])
  const [page, setPage]         = useState(1)
  const [hasMore, setHasMore]   = useState(true)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const sentinelRef             = useRef(null)
  const paramsRef               = useRef(params)

  // Reset when URL or params change
  useEffect(() => {
    paramsRef.current = params
    setItems([])
    setPage(1)
    setHasMore(true)
    setError(null)
  }, [url, JSON.stringify(params)])

  const fetchPage = useCallback(async (pg) => {
    if (loading) return
    setLoading(true)
    try {
      const res = await axios.get(url, {
        params: { ...paramsRef.current, page: pg, limit: pageSize },
      })
      const data = res.data?.data ?? res.data ?? []
      const arr  = Array.isArray(data) ? data : []
      setItems(prev => pg === 1 ? arr : [...prev, ...arr])
      setHasMore(arr.length === pageSize)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [url, pageSize, loading])

  // Fetch on page change
  useEffect(() => {
    fetchPage(page)
  }, [page])

  // IntersectionObserver on sentinel div
  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(p => p + 1)
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loading])

  const reset = useCallback(() => {
    setItems([])
    setPage(1)
    setHasMore(true)
    setError(null)
  }, [])

  return { items, loading, hasMore, error, sentinelRef, reset }
}
