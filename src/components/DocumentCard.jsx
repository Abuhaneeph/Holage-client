import { CheckCircle, FileText, Upload, Loader, AlertCircle } from "lucide-react"

const DocumentCard = ({ 
  document, 
  documentName, 
  documentType, 
  icon: Icon = FileText,
  description,
  onUpload,
  uploading = false 
}) => {
  const isPDF = document && document.toLowerCase().includes('.pdf')
  
  return document ? (
    // Uploaded state
    <div className="bg-muted/30 rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-colors">
      <div 
        className="relative bg-gradient-to-br from-primary/5 to-secondary/5 cursor-pointer" 
        onClick={() => window.open(document, '_blank')}
      >
        {isPDF ? (
          <div className="h-32 flex flex-col items-center justify-center">
            <FileText className="w-12 h-12 text-primary mb-2" />
            <p className="text-text-secondary text-sm font-medium">{documentName}</p>
            <p className="text-text-secondary text-xs">Click to view PDF</p>
          </div>
        ) : (
          <img 
            src={document} 
            alt={documentName} 
            className="w-full h-32 object-cover"
          />
        )}
        <div className="absolute top-2 right-2 bg-success/90 backdrop-blur-sm rounded-full p-1.5">
          <CheckCircle className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="p-4">
        <div className="mb-2">
          <h4 className="font-medium text-text-primary">{documentName}</h4>
          {description && <p className="text-xs text-text-secondary">{description}</p>}
        </div>
        <button 
          onClick={onUpload}
          disabled={uploading}
          className="w-full bg-secondary/10 text-secondary px-3 py-2 rounded-lg text-sm font-medium hover:bg-secondary/20 transition-colors flex items-center justify-center space-x-1 disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>Update {isPDF ? 'Document' : 'Photo'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  ) : (
    // Not uploaded state
    <div className="bg-muted/30 rounded-xl p-4 border border-dashed border-border hover:border-warning/50 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h4 className="font-medium text-text-primary">{documentName}</h4>
            <p className="text-xs text-warning">Not uploaded{description ? ` - ${description}` : ''}</p>
          </div>
        </div>
      </div>
      <button 
        onClick={onUpload}
        disabled={uploading}
        className="w-full bg-muted text-text-secondary px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors flex items-center justify-center space-x-1 disabled:opacity-50"
      >
        {uploading ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            <span>Uploading...</span>
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </>
        )}
      </button>
    </div>
  )
}

export default DocumentCard

