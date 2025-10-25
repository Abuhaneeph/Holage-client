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
      <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-secondary transition-colors bg-input">
        <input type="file" accept={acceptedTypes} onChange={handleFileChange} className="hidden" id={field} />
        <label htmlFor={field} className="cursor-pointer">
          <div className="flex flex-col items-center">
            <Upload className="w-8 h-8 text-text-secondary mb-2" />
            <p className="text-sm text-text-primary">{currentFile ? currentFile.name : "Click to upload file"}</p>
            <p className="text-xs text-text-secondary mt-1">{acceptedTypes}</p>
          </div>
        </label>
      </div>
    </div>
  )
}

export default FileUpload
