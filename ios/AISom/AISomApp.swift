import SwiftUI

@main
struct AISomApp: App {
    var body: some Scene {
        WindowGroup {
            NavigationStack {
                ImportMenuView(service: MenuImportService(
                    baseURL: URL(string: "http://localhost:8787")!,
                    tokenProvider: { DevToken.value }
                ))
            }
        }
    }
}

/// SOLO SVILUPPO. In produzione l'app non deve contenere segreti: usa il token di sessione
/// dell'utente (Sign in with Apple / Supabase Auth) e fallo verificare dal backend.
enum DevToken {
    static let value = ProcessInfo.processInfo.environment["APP_API_TOKEN"] ?? ""
}
