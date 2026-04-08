'use client'
import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useLiveInferenceStore } from '@/store/liveInferenceStore'

export function ImageUploader() {
  const { uploadedImage, setImage } = useLiveInferenceStore()

  const onDrop = useCallback((files: File[]) => {
    if (files.length > 0) setImage(files[0])
  }, [setImage])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
    maxFiles: 1,
  })

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-mono text-muted">Input Image</h3>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-accent bg-accent/10' : 'border-border hover:border-muted'
        }`}
      >
        <input {...getInputProps()} />
        {uploadedImage ? (
          <img
            src={uploadedImage}
            alt="Uploaded driving scene"
            className="w-full h-48 object-contain rounded"
          />
        ) : (
          <div className="py-6">
            <p className="text-sm text-muted">
              {isDragActive ? 'Drop image here...' : 'Drag & drop a CARLA driving scene image, or click to select'}
            </p>
            <p className="text-xs text-muted/60 mt-1">PNG or JPG, 256×256 recommended</p>
          </div>
        )}
      </div>
    </div>
  )
}
