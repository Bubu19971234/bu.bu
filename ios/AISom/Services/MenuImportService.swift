import Foundation
import UIKit

/// Client di ai-som-saas `POST /api/onboarding-import` (lo stesso usato dal pannello web).
/// Due fasi: 1) lettura → anteprima, niente salvato; 2) conferma → salva menù e carta.
/// L'AI non viene mai chiamata dall'app: la chiave resta sul server.
struct MenuImportService {
    /// es. https://ai-som-saas.vercel.app (o il dominio di produzione)
    let baseURL: URL
    /// Token di sessione Supabase del ristoratore (`session.accessToken` di supabase-swift).
    let sessionToken: () async throws -> String
    let localeId: String
    var session: URLSession = .shared

    enum ImportError: LocalizedError {
        case server(String)
        case http(Int)
        var errorDescription: String? {
            switch self {
            case .server(let message): message
            case .http(let status): "Errore del server (\(status))"
            }
        }
    }

    func leggi(link: URL) async throws -> Anteprima {
        try await anteprima(["url": link.absoluteString])
    }

    func leggi(pdf: Data) async throws -> Anteprima {
        try await anteprima(["pdf_base64": pdf.base64EncodedString()])
    }

    /// Le foto si ridimensionano e comprimono: meno token, upload più veloce. Max 10.
    func leggi(foto: [UIImage]) async throws -> Anteprima {
        let immagini: [[String: String]] = foto.prefix(10).compactMap { img in
            guard let jpeg = img.ridimensionata().jpegData(compressionQuality: 0.8) else { return nil }
            return ["base64": jpeg.base64EncodedString(), "media_type": "image/jpeg"]
        }
        return try await anteprima(["immagini": immagini])
    }

    /// Salva l'anteprima così come l'ha corretta il ristoratore.
    func conferma(_ a: Anteprima) async throws {
        let corpo = try JSONSerialization.jsonObject(with: JSONEncoder().encode(a))
        _ = try await invia(["conferma": corpo])
    }

    private func anteprima(_ corpo: [String: Any]) async throws -> Anteprima {
        let data = try await invia(corpo)
        return try JSONDecoder().decode(AnteprimaResponse.self, from: data).anteprima
    }

    private func invia(_ corpo: [String: Any]) async throws -> Data {
        var body = corpo
        body["locale_id"] = localeId
        var req = URLRequest(url: baseURL.appending(path: "api/onboarding-import"))
        req.httpMethod = "POST"
        req.timeoutInterval = 150 // la lettura di un menù lungo con Opus può richiedere un paio di minuti
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("Bearer \(try await sessionToken())", forHTTPHeaderField: "Authorization")
        req.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await session.data(for: req)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(status) else {
            if let err = try? JSONDecoder().decode([String: String].self, from: data), let msg = err["error"] {
                throw ImportError.server(msg)
            }
            throw ImportError.http(status)
        }
        return data
    }
}

private extension UIImage {
    func ridimensionata(latoMax: CGFloat = 1600) -> UIImage {
        let lato = max(size.width, size.height)
        guard lato > latoMax else { return self }
        let k = latoMax / lato
        let dim = CGSize(width: size.width * k, height: size.height * k)
        return UIGraphicsImageRenderer(size: dim).image { _ in draw(in: CGRect(origin: .zero, size: dim)) }
    }
}
