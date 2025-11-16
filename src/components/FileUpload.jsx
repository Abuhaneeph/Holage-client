"use client"

import { Upload } from "lucide-react"

const FileUpload = ({ label, field, acceptedTypes, onFileSelect, currentFile }) => {
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      onFileSelect(field, file)
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-2">{label}</label>
      <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-primary/50 transition-colors bg-white/80 shadow-sm">
        <input type="file" accept={acceptedTypes} onChange={handleFileChange} className="hidden" id={field} />
        <label htmlFor={field} className="cursor-pointer">
          <div className="flex flex-col items-center">
            <Upload className="w-8 h-8 text-text-secondary/70 mb-2" />
            <p className="text-sm font-medium text-text-primary">{currentFile ? currentFile.name : "Click to upload file"}</p>
            <p className="text-xs text-text-secondary/70 mt-1">{acceptedTypes}</p>
          </div>
        </label>
      </div>
      {currentFile && (
        <p className="text-xs text-success mt-2 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          File selected
        </p>
      )}
    </div>
  )
}

export default FileUpload
