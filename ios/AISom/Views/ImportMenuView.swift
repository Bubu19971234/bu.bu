import SwiftUI
import PhotosUI
import UniformTypeIdentifiers

/// Import del menù: QR code, PDF o foto. Il risultato è un'ANTEPRIMA da controllare.
struct ImportMenuView: View {
    let service: MenuImportService

    @State private var showScanner = false
    @State private var showPDFPicker = false
    @State private var photoItems: [PhotosPickerItem] = []
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var anteprima: Anteprima?
    @State private var autorizzato = false

    var body: some View {
        Form {
            Section {
                Toggle("Confermo di essere il titolare del locale o di avere la sua autorizzazione a importare questo menù",
                       isOn: $autorizzato)
                    .font(.footnote)
            } footer: {
                Text("Il menù viene letto da un servizio di intelligenza artificiale (Anthropic). Non inviare dati personali.")
            }

            Section("Importa il menù") {
                Button("Scansiona il QR code", systemImage: "qrcode.viewfinder") { showScanner = true }
                    .disabled(!QRScannerView.isAvailable)
                Button("Carica PDF", systemImage: "doc.richtext") { showPDFPicker = true }
                PhotosPicker(selection: $photoItems, maxSelectionCount: 10, matching: .images) {
                    Label("Foto del menù cartaceo", systemImage: "camera")
                }
            }
            .disabled(!autorizzato || isLoading)

            if isLoading {
                Section {
                    HStack(spacing: 12) {
                        ProgressView()
                        Text("Lettura del menù in corso… può richiedere un paio di minuti.")
                    }
                }
            }
            if let errorMessage {
                Section { Text(errorMessage).foregroundStyle(.red) }
            }
        }
        .navigationTitle("AI Som")
        .sheet(isPresented: $showScanner) {
            QRScannerView { url in
                showScanner = false
                esegui { try await service.leggi(link: url) }
            }
            .ignoresSafeArea()
        }
        .fileImporter(isPresented: $showPDFPicker, allowedContentTypes: [.pdf]) { result in
            guard case .success(let url) = result else { return }
            esegui {
                let accesso = url.startAccessingSecurityScopedResource()
                defer { if accesso { url.stopAccessingSecurityScopedResource() } }
                return try await service.leggi(pdf: Data(contentsOf: url))
            }
        }
        .onChange(of: photoItems) { _, items in
            guard !items.isEmpty else { return }
            esegui {
                var foto: [UIImage] = []
                for item in items {
                    if let data = try await item.loadTransferable(type: Data.self), let img = UIImage(data: data) { foto.append(img) }
                }
                photoItems = []
                return try await service.leggi(foto: foto)
            }
        }
        .navigationDestination(item: $anteprima) { a in
            MenuReviewView(anteprima: a, service: service)
        }
    }

    private func esegui(_ op: @escaping () async throws -> Anteprima) {
        isLoading = true
        errorMessage = nil
        Task {
            defer { isLoading = false }
            do { anteprima = try await op() } catch { errorMessage = error.localizedDescription }
        }
    }
}

extension Anteprima: Hashable {
    func hash(into hasher: inout Hasher) {
        hasher.combine(menu.count); hasher.combine(carta.count)
        hasher.combine(menu.first?.piatti.first?.nome)
    }
}
