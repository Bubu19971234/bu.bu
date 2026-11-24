import SwiftUI
import VisionKit

/// Scanner QR con VisionKit (iOS 16+, dispositivi con A12 o successivi).
/// Richiede NSCameraUsageDescription in Info.plist.
struct QRScannerView: UIViewControllerRepresentable {
    let onFound: (URL) -> Void

    static var isAvailable: Bool {
        DataScannerViewController.isSupported && DataScannerViewController.isAvailable
    }

    func makeUIViewController(context: Context) -> DataScannerViewController {
        let scanner = DataScannerViewController(
            recognizedDataTypes: [.barcode(symbologies: [.qr])],
            qualityLevel: .balanced,
            isHighlightingEnabled: true
        )
        scanner.delegate = context.coordinator
        try? scanner.startScanning()
        return scanner
    }

    func updateUIViewController(_ controller: DataScannerViewController, context: Context) {}

    static func dismantleUIViewController(_ controller: DataScannerViewController, coordinator: Coordinator) {
        controller.stopScanning()
    }

    func makeCoordinator() -> Coordinator { Coordinator(onFound: onFound) }

    final class Coordinator: NSObject, DataScannerViewControllerDelegate {
        let onFound: (URL) -> Void
        private var handled = false

        init(onFound: @escaping (URL) -> Void) { self.onFound = onFound }

        func dataScanner(_ scanner: DataScannerViewController, didAdd items: [RecognizedItem], allItems: [RecognizedItem]) {
            guard !handled else { return }
            for item in items {
                if case .barcode(let code) = item,
                   let payload = code.payloadStringValue,
                   let url = URL(string: payload),
                   ["http", "https"].contains(url.scheme?.lowercased()) {
                    handled = true
                    onFound(url)
                    return
                }
            }
        }
    }
}
