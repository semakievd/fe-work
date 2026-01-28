import { isRef } from 'vue'

export function useJsonFormatter(targetRef) {
  if (!isRef(targetRef)) {
    throw new Error('useJsonFormatter needs ref')
  }

  return () => {
    const value = targetRef.value
    if (!value || typeof value !== 'string' || value.trim() === '') {
      return
    }

    try {
      const parsed = JSON.parse(value)
      targetRef.value = JSON.stringify(parsed, null, 2)
    } catch (error) {
      throw new Error('JSON format invalid')
    }
  }
}
