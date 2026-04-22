import UIKit
import SwiftUI
import PlaygroundSupport

struct DitheringProcessor {
    enum DitheringMethod {
        case threshold
        case orderedDithering4
        case orderedDithering9
        case random
        case errorDiffusion
        case atkinson
    }

    let method: DitheringMethod

    func applyTo(_ image: UIImage, withWidth width: CGFloat? = nil) -> UIImage? {
        guard let grayscaleImage = convertToGrayscale(image) else {
            return nil
        }

        let processedImage: CIImage

        if let width = width {
            processedImage = resizeImage(grayscaleImage, toWidth: width)
        } else {
            processedImage = grayscaleImage
        }

        switch method {
        case .threshold:
            return applyThresholdDithering(processedImage)
        case .orderedDithering4:
            return applyOrderedDithering4(processedImage)
        case .orderedDithering9:
            return applyOrderedDithering9(processedImage)
        case .random:
            return applyRandomDithering(processedImage)
        case .errorDiffusion:
            return applyErrorDiffusion(processedImage)
        case .atkinson:
            return applyAtkinsonDithering(processedImage)
        }
    }

    private func convertToGrayscale(_ image: UIImage) -> CIImage? {
        guard let ciImage = CIImage(image: image) else { return nil }
        return ciImage.applyingFilter("CIPhotoEffectMono")
    }

    private func resizeImage(_ ciImage: CIImage, toWidth targetWidth: CGFloat) -> CIImage {
        let scale = targetWidth / ciImage.extent.width
        return ciImage.applyingFilter("CILanczosScaleTransform", parameters: [kCIInputScaleKey: scale])
    }

    private func applyThresholdDithering(_ ciImage: CIImage) -> UIImage? {
        let context = CIContext()
        guard let cgImage = context.createCGImage(ciImage, from: ciImage.extent) else { return nil }
        
        let width = cgImage.width
        let height = cgImage.height
        let colorSpace = CGColorSpaceCreateDeviceGray()
        let bitmapInfo = CGBitmapInfo(rawValue: CGImageAlphaInfo.none.rawValue)
        
        guard let bitmapContext = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width, space: colorSpace, bitmapInfo: bitmapInfo.rawValue) else { return nil }
        
        bitmapContext.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
        
        guard let pixelBuffer = bitmapContext.data else { return nil }
        let pixelData = pixelBuffer.bindMemory(to: UInt8.self, capacity: width * height)
        
        for y in 0..<height {
            for x in 0..<width {
                let pixelIndex = y * width + x
                let brightness = pixelData[pixelIndex]
                let ditheredBrightness = brightness > 127 ? 255 : 0
                pixelData[pixelIndex] = UInt8(ditheredBrightness)
            }
        }
        
        guard let ditheredCGImage = bitmapContext.makeImage() else { return nil }
        return UIImage(cgImage: ditheredCGImage)
    }

    private func applyOrderedDithering4(_ ciImage: CIImage) -> UIImage? {
        let context = CIContext()
        guard let cgImage = context.createCGImage(ciImage, from: ciImage.extent) else { return nil }
        
        let width = cgImage.width
        let height = cgImage.height
        let colorSpace = CGColorSpaceCreateDeviceGray()
        let bitmapInfo = CGBitmapInfo(rawValue: CGImageAlphaInfo.none.rawValue)
        
        guard let bitmapContext = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width, space: colorSpace, bitmapInfo: bitmapInfo.rawValue) else { return nil }
        
        bitmapContext.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
        
        guard let pixelBuffer = bitmapContext.data else { return nil }
        let pixelData = pixelBuffer.bindMemory(to: UInt8.self, capacity: width * height)
        
        let ditherMatrix: [[UInt8]] = [
            [0, 2],
            [3, 1]
        ]
        
        for y in 0..<height {
            for x in 0..<width {
                let pixelIndex = y * width + x
                let brightness = Float(pixelData[pixelIndex]) / 255.0
                let ditherValue = Float(ditherMatrix[y % 2][x % 2]) / 3.0  // 3 is the max value of the dither matrix
                let ditheredBrightness = brightness > ditherValue ? 255 : 0
                pixelData[pixelIndex] = UInt8(ditheredBrightness)
            }
        }
        
        guard let ditheredCGImage = bitmapContext.makeImage() else { return nil }
        return UIImage(cgImage: ditheredCGImage)
    }

    private func applyOrderedDithering9(_ ciImage: CIImage) -> UIImage? {
        let context = CIContext()
        guard let cgImage = context.createCGImage(ciImage, from: ciImage.extent) else { return nil }
        
        let width = cgImage.width
        let height = cgImage.height
        let colorSpace = CGColorSpaceCreateDeviceGray()
        let bitmapInfo = CGBitmapInfo(rawValue: CGImageAlphaInfo.none.rawValue)
        
        guard let bitmapContext = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width, space: colorSpace, bitmapInfo: bitmapInfo.rawValue) else { return nil }
        
        bitmapContext.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
        
        guard let pixelBuffer = bitmapContext.data else { return nil }
        let pixelData = pixelBuffer.bindMemory(to: UInt8.self, capacity: width * height)
        
        let ditherMatrix: [[UInt8]] = [
            [0, 7, 3],
            [6, 5, 2],
            [4, 1, 8]
        ]
        
        for y in 0..<height {
            for x in 0..<width {
                let pixelIndex = y * width + x
                let brightness = Float(pixelData[pixelIndex]) / 255.0
                let ditherValue = Float(ditherMatrix[y % 3][x % 3]) / 8.0  // 8 is the max value of the dither matrix
                let ditheredBrightness = brightness > ditherValue ? 255 : 0
                pixelData[pixelIndex] = UInt8(ditheredBrightness)
            }
        }
        
        guard let ditheredCGImage = bitmapContext.makeImage() else { return nil }
        return UIImage(cgImage: ditheredCGImage)
    }

    private func applyRandomDithering(_ ciImage: CIImage) -> UIImage? {
        let context = CIContext()
        guard let cgImage = context.createCGImage(ciImage, from: ciImage.extent) else { return nil }
        
        let width = cgImage.width
        let height = cgImage.height
        let colorSpace = CGColorSpaceCreateDeviceGray()
        let bitmapInfo = CGBitmapInfo(rawValue: CGImageAlphaInfo.none.rawValue)
        
        guard let bitmapContext = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width, space: colorSpace, bitmapInfo: bitmapInfo.rawValue) else { return nil }
        
        bitmapContext.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
        
        guard let pixelBuffer = bitmapContext.data else { return nil }
        let pixelData = pixelBuffer.bindMemory(to: UInt8.self, capacity: width * height)
        
        for y in 0..<height {
            for x in 0..<width {
                let pixelIndex = y * width + x
                let brightness = Float(pixelData[pixelIndex]) / 255.0
                let ditherValue = Float(arc4random_uniform(UInt32(256))) / 255.0  // random value between 0 and 1
                let ditheredBrightness = brightness > ditherValue ? 255 : 0
                pixelData[pixelIndex] = UInt8(ditheredBrightness)
            }
        }
        
        guard let ditheredCGImage = bitmapContext.makeImage() else { return nil }
        return UIImage(cgImage: ditheredCGImage)
    }

    private func applyErrorDiffusion(_ ciImage: CIImage) -> UIImage? {
        let context = CIContext()
        guard let cgImage = context.createCGImage(ciImage, from: ciImage.extent) else { return nil }
        
        let width = cgImage.width
        let height = cgImage.height
        let colorSpace = CGColorSpaceCreateDeviceGray()
        let bitmapInfo = CGBitmapInfo(rawValue: CGImageAlphaInfo.none.rawValue)
        
        guard let bitmapContext = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width, space: colorSpace, bitmapInfo: bitmapInfo.rawValue) else { return nil }
        
        bitmapContext.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
        
        guard let pixelBuffer = bitmapContext.data else { return nil }
        let pixelData = pixelBuffer.bindMemory(to: UInt8.self, capacity: width * height)
        
        for y in 0..<height {
            for x in 0..<width {
                let pixelIndex = y * width + x
                let oldPixel = Float(pixelData[pixelIndex]) / 255.0
                let newPixel = round(oldPixel)
                pixelData[pixelIndex] = UInt8(newPixel * 255)
                let quantError = oldPixel - newPixel
                if x < width - 1 {
                    pixelData[(y + 0) * width + (x + 1)] = UInt8(min(255, max(0, Float(pixelData[(y + 0) * width + (x + 1)]) / 255.0 + quantError * 7/16.0) * 255))
                }
                if y < height - 1 {
                    if x > 0 {
                        pixelData[(y + 1) * width + (x - 1)] = UInt8(min(255, max(0, Float(pixelData[(y + 1) * width + (x - 1)]) / 255.0 + quantError * 3/16.0) * 255))
                    }
                    pixelData[(y + 1) * width + (x + 0)] = UInt8(min(255, max(0, Float(pixelData[(y + 1) * width + (x + 0)]) / 255.0 + quantError * 5/16.0) * 255))
                    if x < width - 1 {
                        pixelData[(y + 1) * width + (x + 1)] = UInt8(min(255, max(0, Float(pixelData[(y + 1) * width + (x + 1)]) / 255.0 + quantError * 1/16.0) * 255))
                    }
                }
            }
        }
        
        guard let ditheredCGImage = bitmapContext.makeImage() else { return nil }
        return UIImage(cgImage: ditheredCGImage)
    }

    private func applyAtkinsonDithering(_ ciImage: CIImage) -> UIImage? {
        let context = CIContext()
        guard let cgImage = context.createCGImage(ciImage, from: ciImage.extent) else { return nil }
        
        let width = cgImage.width
        let height = cgImage.height
        let colorSpace = CGColorSpaceCreateDeviceGray()
        let bitmapInfo = CGBitmapInfo(rawValue: CGImageAlphaInfo.none.rawValue)
        
        guard let bitmapContext = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width, space: colorSpace, bitmapInfo: bitmapInfo.rawValue) else { return nil }
        
        bitmapContext.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
        
        guard let pixelBuffer = bitmapContext.data else { return nil }
        let pixelData = pixelBuffer.bindMemory(to: UInt8.self, capacity: width * height)
        
        var errorBuffer = [Int](repeating: 0, count: width * height)
        
        for y in 0..<height {
            for x in 0..<width {
                let pixelIndex = y * width + x
                let oldPixel = Int(pixelData[pixelIndex]) + errorBuffer[pixelIndex]
                let newPixel = oldPixel > 128 ? 255 : 0
                pixelData[pixelIndex] = UInt8(newPixel)
                let quantError = (oldPixel - newPixel) / 8
                if x < width - 1 { errorBuffer[(y + 0) * width + (x + 1)] += quantError }
                if x < width - 2 { errorBuffer[(y + 0) * width + (x + 2)] += quantError }
                if x > 0 && y < height - 1 { errorBuffer[(y + 1) * width + (x - 1)] += quantError }
                if y < height - 1 { errorBuffer[(y + 1) * width + (x + 0)] += quantError }
                if x < width - 1 && y < height - 1 { errorBuffer[(y + 1) * width + (x + 1)] += quantError }
                if y < height - 2 { errorBuffer[(y + 2) * width + (x + 0)] += quantError }
            }
        }
        
        guard let ditheredCGImage = bitmapContext.makeImage() else { return nil }
        return UIImage(cgImage: ditheredCGImage)
    }
}

// Create a SwiftUI view
struct DitheredImageView: View {
    var ditheredImage: UIImage

    var body: some View {
        Image(uiImage: ditheredImage)
            .resizable()
            .aspectRatio(contentMode: .fit)
            .overlay(Color.blue.opacity(0.5).blendMode(.exclusion))
            .background(Color.purple)
            .edgesIgnoringSafeArea(.all)
    }
}

func loadImage(named name: String, ofType type: String) -> UIImage? {
    guard let path = Bundle.main.path(forResource: name, ofType: type) else { return nil }
    return UIImage(contentsOfFile: path)
}

func saveImage(_ image: UIImage, to path: String) {
    guard let data = image.jpegData(compressionQuality: 1) else { return }
    let url = URL(fileURLWithPath: path)
    try? data.write(to: url)
}

// Load the image
if let image = loadImage(named: "alien", ofType: "jpg") {
    // Create a dithering processor with the desired method
    let ditheringProcessor = DitheringProcessor(method: .atkinson)

    // Apply the dithering process
    if let ditheredImage = ditheringProcessor.applyTo(image, withWidth: 500) {
        // Display the processed image in the playground's live view
        let ditheredView = DitheredImageView(ditheredImage: ditheredImage)
        PlaygroundPage.current.setLiveView(ditheredView)
    }
}
