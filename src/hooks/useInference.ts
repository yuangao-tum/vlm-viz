'use client'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { useLiveInferenceStore } from '@/store/liveInferenceStore'
import type { InferenceResponse, InferenceRequest } from '@/types/inference'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export function useInference() {
  const { setStatus, setResult, setError } = useLiveInferenceStore()

  return useMutation<InferenceResponse, Error, InferenceRequest>({
    mutationFn: async (req) => {
      const form = new FormData()
      form.append('image', req.image)
      form.append('vehicle_state', req.vehicle_state)
      form.append('style', req.style)
      const res = await axios.post<InferenceResponse>(`${API_URL}/api/inference`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    },
    onMutate: () => setStatus('loading'),
    onSuccess: (data) => setResult(data),
    onError: (err) => setError(err.message),
  })
}
