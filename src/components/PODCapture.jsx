"use client"

import { useState, useRef } from "react"
import { Camera, X, Loader, CheckCircle } from "lucide-react"
import { useToast } from "../context/ToastContext"

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const PODCapture = ({ shipmentId, podType, onSuccess, onClose }) => {
  const [photos, setPhotos] = useState([])
  const [notes, setNotes] = useState("")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const toast = useToast()

  // Capture photo from camera or file
  const handlePhotoCapture = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        // Store File object and create preview
        const reader = new FileReader()
        reader.onload = (event) => {
          setPhotos(prev => [...prev, { file, preview: event.target.result }])
        }
        reader.readAsDataURL(file)
      }
    })
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (photos.length === 0) {
      toast.error("Please add at least one photo")
      return
    }

    setUploading(true)
    try {
      const token = localStorage.getItem('authToken')
      const formData = new FormData()

      // Add photos as files - extract File objects from photo objects
      photos.forEach((photo, index) => {
        if (typeof photo === 'object' && photo.file) {
          // Has File object - use it directly
          formData.append('photos', photo.file, photo.file.name || `photo-${index}.jpg`)
        } else if (photo instanceof File) {
          // Already a File object
          formData.append('photos', photo, photo.name || `photo-${index}.jpg`)
        } else if (typeof photo === 'string' && photo.startsWith('data:')) {
          // Data URL - convert to blob
          // Note: This will be handled asynchronously, but for now we'll convert it
          const byteString = atob(photo.split(',')[1])
          const mimeString = photo.split(',')[0].split(':')[1].split(';')[0]
          const ab = new ArrayBuffer(byteString.length)
          const ia = new Uint8Array(ab)
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i)
          }
          const blob = new Blob([ab], { type: mimeString })
          formData.append('photos', blob, `photo-${index}.jpg`)
        }
      })

      formData.append('podType', podType)
      formData.append('notes', notes)

      const response = await fetch(`${API_BASE_URL}/pod/${shipmentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const data = await response.json()
      if (response.ok && data.success) {
        toast.success(data.message || `POD ${podType} captured successfully!`)
        if (onSuccess) onSuccess(data)
        if (onClose) onClose()
      } else {
        toast.error(data.message || 'Failed to save POD')
      }
    } catch (error) {
      console.error('Error submitting POD:', error)
      toast.error('Error submitting POD')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
          <h2 className="text-text-primary font-bold text-xl">
            Capture {podType === 'pickup' ? 'Pickup' : 'Delivery'} POD
          </h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Photos Section */}
          <div>
            <label className="text-text-primary font-medium mb-2 block">
              Photos <span className="text-text-secondary text-sm">({photos.length}/10)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              {photos.map((photo, index) => {
                const photoSrc = typeof photo === 'object' && photo.preview ? photo.preview : photo
                return (
                  <div key={index} className="relative">
                    <img
                      src={photoSrc}
                      alt={`POD ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 bg-error text-white rounded-full p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
              {photos.length < 10 && (
                <button
                  onClick={handlePhotoCapture}
                  className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center hover:border-primary transition-colors"
                >
                  <Camera className="w-8 h-8 text-text-secondary mb-2" />
                  <span className="text-text-secondary text-sm">Add Photo</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Notes Section */}
          <div>
            <label className="text-text-primary font-medium mb-2 block">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes or comments..."
              rows={3}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-text-primary resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSubmit}
              disabled={uploading || photos.length === 0}
              className="flex-1 bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {uploading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Submit POD</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-border rounded-lg font-medium text-text-primary hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PODCapture

