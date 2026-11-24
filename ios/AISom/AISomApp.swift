import SwiftUI

@main
struct AISomApp: App {
    var body: some Scene {
        WindowGroup {
            NavigationStack {
                ImportMenuView(service: MenuImportService(
                    baseURL: Config.baseURL,
                    sessionToken: { try await Config.sessionToken() },
                    localeId: Config.localeId
                ))
            }
        }
    }
}

/// Da collegare al login Supabase (pacchetto supabase-swift): il token è quello di sessione
/// del ristoratore, lo stesso che usa il pannello web. Nessuna chiave segreta nell'app.
enum Config {
    static let baseURL = URL(string: "https://ai-som-saas.vercel.app")!
    static var localeId: String { UserDefaults.standard.string(forKey: "locale_id") ?? "" }
    static func sessionToken() async throws -> String {
        // try await supabase.auth.session.accessToken
        UserDefaults.standard.string(forKey: "dev_session_token") ?? ""
    }
}
