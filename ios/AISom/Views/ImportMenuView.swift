import SwiftUI
import PhotosUI
import UniformTypeIdentifiers

/// Schermata di import: QR code, PDF o foto del menu cartaceo.
struct ImportMenuView: View {
    let service: MenuImportService

    @State private var showScanner = false
    @State private var showPDFPicker = false
    @State private var photoItems: [PhotosPickerItem] = []
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var imported: MenuImportResponse?
    @State private var hasAuthorization = false

    var body: some View {
        Form {
            Section {
                Toggle("Confermo di essere il titolare del locale o di avere la sua autorizzazione a importare questo menu",
                       isOn: $hasAuthorization)
                    .font(.footnote)
            } footer: {
                Text("Il menu viene inviato a un servizio di intelligenza artificiale esterno (Anthropic) per essere letto. Non inviare dati personali.")
            }

            Section("Importa il menu") {
                Button("Scansiona QR code", systemImage: "qrcode.viewfinder") { showScanner = true }
                    .disabled(!QRScannerView.isAvailable)
                Button("Carica PDF", systemImage: "doc.richtext") { showPDFPicker = true }
                PhotosPicker(selection: $photoItems, maxSelectionCount: 20, matching: .images) {
                    Label("Foto del menu cartaceo", systemImage: "camera")
                }
            }
            .disabled(!hasAuthorization || isLoading)

            if isLoading {
                Section {
                    HStack(spacing: 12) {
                        ProgressView()
                        Text("Lettura del menu in corso… può richiedere fino a un paio di minuti.")
                    }
                }
            }
            if let errorMessage {
                Section { Text(errorMessage).foregroundStyle(.red) }
            }
        }
        .navigationTitle("AI som")
        .sheet(isPresented: $showScanner) {
            QRScannerView { url in
                showScanner = false
                run { try await service.importFrom(url: url) }
            }
            .ignoresSafeArea()
        }
        .fileImporter(isPresented: $showPDFPicker, allowedContentTypes: [.pdf]) { result in
            guard case .success(let url) = result else { return }
            run {
                let accessed = url.startAccessingSecurityScopedResource()
                defer { if accessed { url.stopAccessingSecurityScopedResource() } }
                return try await service.importFrom(pdf: Data(contentsOf: url))
            }
        }
        .onChange(of: photoItems) { _, items in
            guard !items.isEmpty else { return }
            run {
                var images: [UIImage] = []
                for item in items {
                    if let data = try await item.loadTransferable(type: Data.self), let image = UIImage(data: data) {
                        images.append(image)
                    }
                }
                photoItems = []
                return try await service.importFrom(photos: images)
            }
        }
        .navigationDestination(item: $imported) { response in
            MenuReviewView(menu: response.menu, resolvedFrom: response.resolvedFrom)
        }
    }

    private func run(_ operation: @escaping () async throws -> MenuImportResponse) {
        isLoading = true
        errorMessage = nil
        Task {
            defer { isLoading = false }
            do { imported = try await operation() }
            catch { errorMessage = error.localizedDescription }
        }
    }
}

extension MenuImportResponse: Hashable {
    static func == (a: Self, b: Self) -> Bool { a.menu == b.menu && a.resolvedFrom == b.resolvedFrom }
    func hash(into hasher: inout Hasher) { hasher.combine(resolvedFrom); hasher.combine(menu.restaurantName) }
}
