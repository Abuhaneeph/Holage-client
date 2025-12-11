import { useState, useEffect, useRef } from 'react'
import { Search, MapPin, Loader } from 'lucide-react'
import { searchAddresses } from '../utils/mapbox'

/**
 * AddressAutocomplete Component
 * Provides address autocomplete functionality using Mapbox Geocoding API
 * 
 * @param {string} value - Current input value
 * @param {Function} onChange - Callback when address is selected
 * @param {string} placeholder - Input placeholder
 * @param {string} label - Label for the input
 * @param {boolean} disabled - Whether input is disabled
 * @param {string} country - Country code (default: 'NG')
 */
const AddressAutocomplete = ({
  value = '',
  onChange,
  placeholder = 'Start typing an address...',
  label = '',
  disabled = false,
  country = 'NG'
}) => {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef(null)
  const suggestionsRef = useRef(null)
  const debounceTimerRef = useRef(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  // Debounced search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!query || query.trim().length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setLoading(true)
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchAddresses(query, country, 5)
        setSuggestions(results)
        setShowSuggestions(true)
        setSelectedIndex(-1)
      } catch (error) {
        console.error('Address search error:', error)
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 300) // 300ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [query, country])

  const handleInputChange = (e) => {
    const newValue = e.target.value
    setQuery(newValue)
    if (onChange) {
      onChange({ address: newValue, coordinates: null })
    }
  }

  const handleSelect = (suggestion) => {
    setQuery(suggestion.address)
    setShowSuggestions(false)
    setSuggestions([])
    if (onChange) {
      onChange({
        address: suggestion.address,
        coordinates: suggestion.coordinates
      })
    }
    inputRef.current?.blur()
  }

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        break
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="relative">
      {label && (
        <label className="block text-text-primary font-medium mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary">
          {loading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-12 pr-4 py-4 bg-input border border-border rounded-xl text-text-primary text-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-lg max-h-64 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-start gap-3 ${
                index === selectedIndex ? 'bg-muted' : ''
              }`}
            >
              <MapPin className="w-5 h-5 text-text-secondary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-text-primary font-medium text-sm truncate">
                  {suggestion.address}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && !loading && suggestions.length === 0 && query.length >= 2 && (
        <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-lg p-4">
          <p className="text-text-secondary text-sm text-center">
            No addresses found. Try a different search term.
          </p>
        </div>
      )}
    </div>
  )
}

export default AddressAutocomplete

