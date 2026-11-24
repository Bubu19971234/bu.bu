import Foundation
import UIKit

/// Client dell'endpoint POST /v1/menu/import del backend.
/// L'AI non viene mai chiamata dall'app: la chiave Anthropic resta sul server.
struct MenuImportService {
    let baseURL: URL
    let tokenProvider: () async throws -> String
    var session: URLSession = .shared

    enum ImportError: LocalizedError {
        case server(code: String, message: String)
        case http(Int)

        var errorDescription: String? {
            switch self {
            case .server(_, let message): message
            case .http(let status): "Errore del server (\(status))"
            }
        }
    }

    func importFrom(url: URL) async throws -> MenuImportResponse {
        try await send(["url": url.absoluteString])
    }

    func importFrom(pdf: Data) async throws -> MenuImportResponse {
        try await send(["pdf_base64": pdf.base64EncodedString()])
    }

    /// Le foto vengono ridimensionate e compresse: meno token, upload più veloce.
    func importFrom(photos: [UIImage]) async throws -> MenuImportResponse {
        let images: [[String: String]] = photos.compactMap { image in
            guard let jpeg = image.resizedForUpload().jpegData(compressionQuality: 0.8) else { return nil }
            return ["base64": jpeg.base64EncodedString(), "media_type": "image/jpeg"]
        }
        return try await send(["images": images])
    }

    private func send(_ body: [String: Any]) async throws -> MenuImportResponse {
        var request = URLRequest(url: baseURL.appending(path: "v1/menu/import"))
        request.httpMethod = "POST"
        request.timeoutInterval = 180 // l'estrazione di una carta vini lunga può richiedere minuti
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(try await tokenProvider())", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await session.data(for: request)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase

        guard (200..<300).contains(status) else {
            if let err = try? decoder.decode(ServerError.self, from: data) {
                throw ImportError.server(code: err.error, message: err.message ?? err.error)
            }
            throw ImportError.http(status)
        }
        return try decoder.decode(MenuImportResponse.self, from: data)
    }

    private struct ServerError: Decodable {
        let error: String
        let message: String?
    }
}

private extension UIImage {
    /// Lato lungo max ~1600 px: oltre, il modello ridimensiona comunque e paghi solo upload.
    func resizedForUpload(maxSide: CGFloat = 1600) -> UIImage {
        let longest = max(size.width, size.height)
        guard longest > maxSide else { return self }
        let scale = maxSide / longest
        let target = CGSize(width: size.width * scale, height: size.height * scale)
        return UIGraphicsImageRenderer(size: target).image { _ in draw(in: CGRect(origin: .zero, size: target)) }
    }
}
