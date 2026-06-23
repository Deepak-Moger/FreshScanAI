'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  X,
  Sparkles,
  Clock,
  TrendingUp,
  Camera,
  FileText,
  ImageIcon,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  ScanLine,
  History,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ConfidenceGauge } from '@/components/confidence-gauge'

// Browser calls stay on Next.js API routes; those routes proxy to Flask.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

type FreshnessResult = {
  label: string
  confidence: number
}

type OCRResult = {
  extracted_text: string
  expiry_date: string
  expiry_source?: string
  expiry_match?: string
  ocr_engine?: string
}

type ScanHistoryItem = {
  id: string
  timestamp: Date
  imagePreview: string
  result: FreshnessResult
  type: 'upload' | 'webcam'
}

async function readApiResponse(response: Response) {
  const text = await response.text()
  let data: any

  try {
    data = JSON.parse(text)
  } catch {
    data = { success: false, error: text || `Request failed with HTTP ${response.status}` }
  }

  if (!response.ok) {
    throw new Error(data.error || `Request failed with HTTP ${response.status}`)
  }

  return data
}

export default function FoodFreshnessScanner() {
  const [activeTab, setActiveTab] = useState('upload')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [freshnessResult, setFreshnessResult] = useState<FreshnessResult | null>(null)
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([])
  const [isWebcamActive, setIsWebcamActive] = useState(false)
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const ocrFileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Cleanup webcam on unmount
  useEffect(() => {
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [webcamStream])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    setError(null)
    
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
        setFreshnessResult(null)
        setOcrResult(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isOCR = false) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setError(null)
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
        setFreshnessResult(null)
        setOcrResult(null)
      }
      reader.readAsDataURL(file)
      
      // Auto-scan for OCR tab
      if (isOCR) {
        setTimeout(() => handleOCRScan(file), 100)
      }
    }
  }

  const handleFreshnessScan = async () => {
    if (!selectedFile && !selectedImage) return
    
    setIsScanning(true)
    setError(null)
    
    try {
      const formData = new FormData()
      
      if (selectedFile) {
        formData.append('file', selectedFile)
      } else if (selectedImage) {
        // Convert base64 to blob
        const response = await fetch(selectedImage)
        const blob = await response.blob()
        formData.append('file', blob, 'food.jpg')
      }
      
      const apiResponse = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        body: formData,
      })

      const data = await readApiResponse(apiResponse)

      if (data.success && data.data) {
        // Map backend response to our format
        const result: FreshnessResult = {
          label: data.data.label,
          confidence: data.data.confidence,
        }

        // Simulate scan animation duration
        setTimeout(() => {
          setFreshnessResult(result)
          setIsScanning(false)

          // Add to history
          if (selectedImage) {
            addToHistory(result, 'upload')
          }
        }, 2000)
      } else {
        throw new Error(data.error || 'Invalid response format')
      }
    } catch (err) {
      console.log('[v0] API Error:', err)
      setError('API unavailable: ' + (err instanceof Error ? err.message : 'Unknown error'))
      setIsScanning(false)
    }
  }

  const handleOCRScan = async (file?: File) => {
    const fileToScan = file || selectedFile
    if (!fileToScan) return
    
    setIsScanning(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('file', fileToScan)
      
      const apiResponse = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      })

      const data = await readApiResponse(apiResponse)

      if (data.success && data.data) {
        setTimeout(() => {
          setOcrResult({
            extracted_text: data.data.extracted_text || '',
            expiry_date: data.data.expiry_date || '',
            expiry_source: data.data.expiry_source,
            expiry_match: data.data.expiry_match,
            ocr_engine: data.data.ocr_engine,
          })
          setIsScanning(false)
        }, 1500)
      } else {
        throw new Error(data.error || 'OCR failed')
      }
    } catch (err) {
      console.log('[v0] OCR API Error:', err)
      setError('OCR API unavailable: ' + (err instanceof Error ? err.message : 'Unknown error'))
      setIsScanning(false)
    }
  }

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      setWebcamStream(stream)
      setIsWebcamActive(true)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      setError('Could not access camera. Please check permissions.')
      console.log('[v0] Webcam error:', err)
    }
  }

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop())
      setWebcamStream(null)
    }
    setIsWebcamActive(false)
  }

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)
    
    const base64Image = canvas.toDataURL('image/jpeg', 0.9)
    setSelectedImage(base64Image)
    setIsScanning(true)
    setError(null)
    
    try {
      const apiResponse = await fetch(`${API_BASE_URL}/predict_webcam`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      })

      const data = await readApiResponse(apiResponse)

      if (data.success && data.data) {
        setTimeout(() => {
          const result: FreshnessResult = {
            label: data.data.label,
            confidence: data.data.confidence,
          }
          setFreshnessResult(result)
          setIsScanning(false)
          addToHistory(result, 'webcam')
          stopWebcam()
        }, 2000)
      } else {
        throw new Error(data.error || 'Webcam analysis failed')
      }
    } catch (err) {
      console.log('[v0] Webcam API Error:', err)
      setError('Webcam API unavailable: ' + (err instanceof Error ? err.message : 'Unknown error'))
      setIsScanning(false)
      stopWebcam()
    }
  }

  const addToHistory = useCallback((result: FreshnessResult, type: 'upload' | 'webcam') => {
    if (!selectedImage) return
    
    const newItem: ScanHistoryItem = {
      id: Date.now().toString(),
      timestamp: new Date(),
      imagePreview: selectedImage,
      result,
      type,
    }
    
    setScanHistory(prev => [newItem, ...prev].slice(0, 10))
  }, [selectedImage])

  const handleReset = () => {
    setSelectedImage(null)
    setSelectedFile(null)
    setFreshnessResult(null)
    setOcrResult(null)
    setIsScanning(false)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (ocrFileInputRef.current) ocrFileInputRef.current.value = ''
    stopWebcam()
  }

  const getStatusIcon = (label: string) => {
    const lower = label.toLowerCase()
    if (lower === 'fresh') return <CheckCircle2 className="w-6 h-6" />
    if (lower === 'spoiled') return <XCircle className="w-6 h-6" />
    return <AlertTriangle className="w-6 h-6" />
  }

  const getStatusColor = (label: string) => {
    const lower = label.toLowerCase()
    if (lower === 'fresh') return 'text-fresh'
    return 'text-destructive'
  }

  const getStatusBg = (label: string) => {
    const lower = label.toLowerCase()
    if (lower === 'fresh') return 'from-fresh/20 to-fresh/5 border-fresh/30'
    return 'from-destructive/20 to-destructive/5 border-destructive/30'
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-fresh/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 right-1/4 w-72 h-72 bg-warn/5 rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 py-6 lg:py-10 max-w-7xl">
        <div className="flex flex-col xl:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <motion.header
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fresh via-fresh to-fresh-dim flex items-center justify-center shadow-lg shadow-fresh/25">
                    <ScanLine className="w-7 h-7 text-background" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-fresh rounded-full animate-pulse" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-balance">
                    FreshScan AI
                  </h1>
                  <p className="text-muted-foreground text-sm lg:text-base">
                    Powered by Deep Learning
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground max-w-2xl text-pretty">
                Upload a photo of your food to instantly detect freshness, or scan product labels to extract expiry dates using AI-powered OCR.
              </p>
            </motion.header>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid grid-cols-3 w-full max-w-md bg-card/60 backdrop-blur-xl border border-border p-1">
                <TabsTrigger value="upload" className="data-[state=active]:bg-fresh data-[state=active]:text-background gap-2">
                  <ImageIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Upload</span>
                </TabsTrigger>
                <TabsTrigger value="webcam" className="data-[state=active]:bg-fresh data-[state=active]:text-background gap-2">
                  <Camera className="w-4 h-4" />
                  <span className="hidden sm:inline">Camera</span>
                </TabsTrigger>
                <TabsTrigger value="ocr" className="data-[state=active]:bg-fresh data-[state=active]:text-background gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">OCR</span>
                </TabsTrigger>
              </TabsList>

              <AnimatePresence>
                {/* Upload Tab */}
                <TabsContent value="upload" key="upload-tab" className="mt-0">
                  <motion.div
                    key="upload-tab"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                  >
                    {!freshnessResult ? (
                      <Card
                        className={`relative overflow-hidden transition-all duration-300 backdrop-blur-xl border-2 ${
                          isDragging
                            ? 'border-fresh bg-fresh/5'
                            : 'border-border bg-card/40'
                        }`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                      >
                        {selectedImage ? (
                          <div className="relative">
                            <div className="relative aspect-[4/3] w-full overflow-hidden">
                              <img
                                src={selectedImage}
                                alt="Selected food"
                                className="w-full h-full object-cover"
                              />
                              {isScanning && (
                                <div className="absolute inset-0 bg-background/40 backdrop-blur-sm">
                                  <motion.div
                                    className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-fresh to-transparent shadow-[0_0_30px_rgba(16,185,129,0.8)]"
                                    initial={{ top: 0 }}
                                    animate={{ top: '100%' }}
                                    transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                      <Sparkles className="w-12 h-12 text-fresh mx-auto mb-3 animate-pulse" />
                                      <p className="text-lg font-medium text-foreground">Analyzing freshness...</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="p-5 flex gap-3">
                              <Button
                                onClick={handleFreshnessScan}
                                disabled={isScanning}
                                className="flex-1 bg-fresh hover:bg-fresh/90 text-background font-semibold h-12"
                              >
                                {isScanning ? (
                                  <>
                                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                    Scanning...
                                  </>
                                ) : (
                                  <>
                                    <Zap className="w-5 h-5 mr-2" />
                                    Analyze Freshness
                                  </>
                                )}
                              </Button>
                              <Button
                                onClick={handleReset}
                                variant="outline"
                                className="h-12 px-4"
                                disabled={isScanning}
                              >
                                <X className="w-5 h-5" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-10 lg:p-16">
                            <div className="flex flex-col items-center text-center space-y-6">
                              <motion.div
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                className="relative"
                              >
                                <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-fresh/20 via-fresh/10 to-transparent flex items-center justify-center backdrop-blur-sm border-2 border-fresh/20">
                                  <Upload className="w-14 h-14 text-fresh" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-fresh flex items-center justify-center">
                                  <ImageIcon className="w-4 h-4 text-background" />
                                </div>
                              </motion.div>
                              <div>
                                <h2 className="text-2xl font-semibold mb-2 text-balance">
                                  Drop your food photo here
                                </h2>
                                <p className="text-muted-foreground max-w-sm text-pretty">
                                  Supports JPG, PNG, WEBP up to 10MB
                                </p>
                              </div>
                              <Button
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-fresh hover:bg-fresh/90 text-background font-semibold h-12 px-8"
                              >
                                <Upload className="w-5 h-5 mr-2" />
                                Choose File
                              </Button>
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileSelect(e)}
                                className="hidden"
                              />
                            </div>
                          </div>
                        )}
                      </Card>
                    ) : (
                      <ResultsView
                        result={freshnessResult}
                        imagePreview={selectedImage}
                        onReset={handleReset}
                        getStatusIcon={getStatusIcon}
                        getStatusColor={getStatusColor}
                        getStatusBg={getStatusBg}
                      />
                    )}
                  </motion.div>
                </TabsContent>

                {/* Webcam Tab */}
                <TabsContent value="webcam" key="webcam-tab" className="mt-0">
                  <motion.div
                    key="webcam-tab"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                  >
                    {!freshnessResult ? (
                      <Card className="relative overflow-hidden backdrop-blur-xl border-2 border-border bg-card/40">
                        {isWebcamActive ? (
                          <div className="relative">
                            <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                              <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                              />
                              <canvas ref={canvasRef} className="hidden" />
                              {isScanning && (
                                <div className="absolute inset-0 bg-background/40 backdrop-blur-sm">
                                  <motion.div
                                    className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-fresh to-transparent shadow-[0_0_30px_rgba(16,185,129,0.8)]"
                                    initial={{ top: 0 }}
                                    animate={{ top: '100%' }}
                                    transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                                  />
                                </div>
                              )}
                              {/* Viewfinder overlay */}
                              <div className="absolute inset-8 border-2 border-fresh/40 rounded-2xl pointer-events-none">
                                <div className="absolute -top-px -left-px w-6 h-6 border-t-2 border-l-2 border-fresh rounded-tl-xl" />
                                <div className="absolute -top-px -right-px w-6 h-6 border-t-2 border-r-2 border-fresh rounded-tr-xl" />
                                <div className="absolute -bottom-px -left-px w-6 h-6 border-b-2 border-l-2 border-fresh rounded-bl-xl" />
                                <div className="absolute -bottom-px -right-px w-6 h-6 border-b-2 border-r-2 border-fresh rounded-br-xl" />
                              </div>
                            </div>
                            <div className="p-5 flex gap-3">
                              <Button
                                onClick={captureAndAnalyze}
                                disabled={isScanning}
                                className="flex-1 bg-fresh hover:bg-fresh/90 text-background font-semibold h-12"
                              >
                                {isScanning ? (
                                  <>
                                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                    Analyzing...
                                  </>
                                ) : (
                                  <>
                                    <Camera className="w-5 h-5 mr-2" />
                                    Capture & Analyze
                                  </>
                                )}
                              </Button>
                              <Button
                                onClick={stopWebcam}
                                variant="outline"
                                className="h-12 px-4"
                                disabled={isScanning}
                              >
                                <X className="w-5 h-5" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-10 lg:p-16">
                            <div className="flex flex-col items-center text-center space-y-6">
                              <motion.div
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                className="relative"
                              >
                                <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-fresh/20 via-fresh/10 to-transparent flex items-center justify-center backdrop-blur-sm border-2 border-fresh/20">
                                  <Camera className="w-14 h-14 text-fresh" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-fresh flex items-center justify-center">
                                  <Zap className="w-4 h-4 text-background" />
                                </div>
                              </motion.div>
                              <div>
                                <h2 className="text-2xl font-semibold mb-2 text-balance">
                                  Real-time Food Analysis
                                </h2>
                                <p className="text-muted-foreground max-w-sm text-pretty">
                                  Point your camera at food for instant freshness detection
                                </p>
                              </div>
                              <Button
                                onClick={startWebcam}
                                className="bg-fresh hover:bg-fresh/90 text-background font-semibold h-12 px-8"
                              >
                                <Camera className="w-5 h-5 mr-2" />
                                Start Camera
                              </Button>
                            </div>
                          </div>
                        )}
                      </Card>
                    ) : (
                      <ResultsView
                        result={freshnessResult}
                        imagePreview={selectedImage}
                        onReset={handleReset}
                        getStatusIcon={getStatusIcon}
                        getStatusColor={getStatusColor}
                        getStatusBg={getStatusBg}
                      />
                    )}
                  </motion.div>
                </TabsContent>

                {/* OCR Tab */}
                <TabsContent value="ocr" key="ocr-tab" className="mt-0">
                  <motion.div
                    key="ocr-tab"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                  >
                    {!ocrResult ? (
                      <Card className="relative overflow-hidden backdrop-blur-xl border-2 border-border bg-card/40">
                        {selectedImage ? (
                          <div className="relative">
                            <div className="relative aspect-[4/3] w-full overflow-hidden">
                              <img
                                src={selectedImage}
                                alt="Product label"
                                className="w-full h-full object-cover"
                              />
                              {isScanning && (
                                <div className="absolute inset-0 bg-background/40 backdrop-blur-sm">
                                  <motion.div
                                    className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-warn to-transparent shadow-[0_0_20px_rgba(245,158,11,0.8)]"
                                    initial={{ top: 0 }}
                                    animate={{ top: '100%' }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                      <FileText className="w-12 h-12 text-warn mx-auto mb-3 animate-pulse" />
                                      <p className="text-lg font-medium text-foreground">Extracting text...</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="p-5 flex gap-3">
                              <Button
                                onClick={() => handleOCRScan()}
                                disabled={isScanning}
                                className="flex-1 bg-warn hover:bg-warn/90 text-background font-semibold h-12"
                              >
                                {isScanning ? (
                                  <>
                                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                    Extracting...
                                  </>
                                ) : (
                                  <>
                                    <FileText className="w-5 h-5 mr-2" />
                                    Extract Expiry Date
                                  </>
                                )}
                              </Button>
                              <Button
                                onClick={handleReset}
                                variant="outline"
                                className="h-12 px-4"
                                disabled={isScanning}
                              >
                                <X className="w-5 h-5" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-10 lg:p-16">
                            <div className="flex flex-col items-center text-center space-y-6">
                              <motion.div
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                className="relative"
                              >
                                <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-warn/20 via-warn/10 to-transparent flex items-center justify-center backdrop-blur-sm border-2 border-warn/20">
                                  <FileText className="w-14 h-14 text-warn" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-warn flex items-center justify-center">
                                  <Calendar className="w-4 h-4 text-background" />
                                </div>
                              </motion.div>
                              <div>
                                <h2 className="text-2xl font-semibold mb-2 text-balance">
                                  Expiry Date Extraction
                                </h2>
                                <p className="text-muted-foreground max-w-sm text-pretty">
                                  Upload a photo of product packaging to extract expiry information
                                </p>
                              </div>
                              <Button
                                onClick={() => ocrFileInputRef.current?.click()}
                                className="bg-warn hover:bg-warn/90 text-background font-semibold h-12 px-8"
                              >
                                <Upload className="w-5 h-5 mr-2" />
                                Upload Label Image
                              </Button>
                              <input
                                ref={ocrFileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileSelect(e, true)}
                                className="hidden"
                              />
                            </div>
                          </div>
                        )}
                      </Card>
                    ) : (
                      <OCRResultsView
                        result={ocrResult}
                        imagePreview={selectedImage}
                        onReset={handleReset}
                      />
                    )}
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>

            {/* Error Toast */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="mt-4"
                >
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-warn/10 border border-warn/20 text-warn">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* History Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full xl:w-80 shrink-0"
          >
            <Card className="p-5 bg-card/40 backdrop-blur-xl border-2 border-border sticky top-6">
              <div className="flex items-center gap-2 mb-5">
                <History className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold">Recent Scans</h3>
                <Badge variant="secondary" className="ml-auto">
                  {scanHistory.length}
                </Badge>
              </div>
              
              {scanHistory.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                    <ScanLine className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No scans yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Your scan history will appear here</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {scanHistory.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-muted">
                        <img
                          src={item.imagePreview}
                          alt="Scan preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${getStatusColor(item.result.label)}`}>
                            {item.result.label}
                          </span>
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            {item.type === 'webcam' ? <Camera className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.result.confidence.toFixed(1)}% confidence
                        </p>
                        <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </motion.aside>
        </div>
      </div>
    </div>
  )
}

// Results View Component
function ResultsView({
  result,
  imagePreview,
  onReset,
  getStatusIcon,
  getStatusColor,
  getStatusBg,
}: {
  result: FreshnessResult
  imagePreview: string | null
  onReset: () => void
  getStatusIcon: (label: string) => React.ReactNode
  getStatusColor: (label: string) => string
  getStatusBg: (label: string) => string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Image Preview */}
      {imagePreview && (
        <Card className="overflow-hidden bg-card/40 backdrop-blur-xl border-2 border-border">
          <div className="relative aspect-video w-full overflow-hidden">
            <img
              src={imagePreview}
              alt="Analyzed food"
              className="w-full h-full object-cover"
            />
            <div className={`absolute top-4 right-4 px-4 py-2 rounded-xl backdrop-blur-xl border ${getStatusBg(result.label)}`}>
              <span className={`font-semibold ${getStatusColor(result.label)}`}>
                {result.label}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Results Grid */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={`p-6 bg-gradient-to-br ${getStatusBg(result.label)} backdrop-blur-xl border-2 h-full`}>
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl bg-background/50 flex items-center justify-center ${getStatusColor(result.label)}`}>
                {getStatusIcon(result.label)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Freshness Status</p>
                <p className={`text-3xl font-bold ${getStatusColor(result.label)}`}>
                  {result.label}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Confidence Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 bg-card/40 backdrop-blur-xl border-2 border-border h-full">
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-sm text-muted-foreground mb-3">Confidence Score</p>
              <ConfidenceGauge value={result.confidence} />
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Actions */}
      <Button
        onClick={onReset}
        className="w-full bg-fresh hover:bg-fresh/90 text-background font-semibold h-12"
      >
        <RefreshCw className="w-5 h-5 mr-2" />
        Scan Another Item
      </Button>
    </motion.div>
  )
}

// OCR Results View Component
function OCRResultsView({
  result,
  imagePreview,
  onReset,
}: {
  result: OCRResult
  imagePreview: string | null
  onReset: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Image Preview */}
      {imagePreview && (
        <Card className="overflow-hidden bg-card/40 backdrop-blur-xl border-2 border-border">
          <div className="relative aspect-video w-full overflow-hidden">
            <img
              src={imagePreview}
              alt="Product label"
              className="w-full h-full object-cover"
            />
          </div>
        </Card>
      )}

      {/* OCR Results */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Expiry Date Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-gradient-to-br from-warn/20 to-warn/5 border-2 border-warn/30 backdrop-blur-xl h-full">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-warn/20 flex items-center justify-center text-warn">
                <Calendar className="w-8 h-8" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground mb-1">Expiry Date</p>
                <p className="text-2xl font-bold text-warn break-words">
                  {result.expiry_date || 'Not Found'}
                </p>
                {result.expiry_source && result.expiry_source !== 'not_found' && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {result.expiry_source === 'keyword' ? 'Matched expiry label' : 'Detected date'}{result.expiry_match ? `: ${result.expiry_match}` : ''}
                  </p>
                )}
                {result.ocr_engine && (
                  <Badge variant="secondary" className="mt-3">
                    {result.ocr_engine}
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Extracted Text Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 bg-card/40 backdrop-blur-xl border-2 border-border h-full">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0 w-full">
                <p className="text-sm text-muted-foreground mb-2">Extracted Text</p>
                <pre className="max-h-80 overflow-auto text-sm text-foreground whitespace-pre-wrap break-words font-mono bg-muted/30 p-3 rounded-lg">
                  {result.extracted_text || 'No text detected'}
                </pre>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Actions */}
      <Button
        onClick={onReset}
        className="w-full bg-warn hover:bg-warn/90 text-background font-semibold h-12"
      >
        <RefreshCw className="w-5 h-5 mr-2" />
        Scan Another Label
      </Button>
    </motion.div>
  )
}
