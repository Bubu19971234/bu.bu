import SwiftUI

/// Revisione obbligatoria: niente va online senza la conferma del ristoratore.
/// Prezzi e allergeni sono responsabilità sua (Reg. UE 1169/2011).
struct MenuReviewView: View {
    @State var anteprima: Anteprima
    let service: MenuImportService
    @State private var confermato = false
    @State private var salvataggio = false
    @State private var salvato = false
    @State private var errore: String?

    private var daControllare: Int { anteprima.menu.flatMap(\.piatti).filter(\.daControllare).count }

    var body: some View {
        List {
            Section {
                if daControllare > 0 {
                    Label("\(daControllare) piatti da controllare: prezzo non letto o nessun allergene dichiarato nel menù.",
                          systemImage: "exclamationmark.triangle.fill")
                        .foregroundStyle(.orange)
                }
                NavigationLink("Anteprima per i clienti") { MenuLayoutView(anteprima: anteprima, theme: .classico) }
            }

            ForEach($anteprima.menu) { $sezione in
                Section {
                    ForEach($sezione.piatti) { $piatto in
                        NavigationLink { PiattoEditor(piatto: $piatto) } label: {
                            HStack {
                                VStack(alignment: .leading) {
                                    Text(piatto.nome)
                                    Text(piatto.prezzo > 0 ? piatto.prezzo.euro : "Prezzo non letto")
                                        .font(.caption).foregroundStyle(.secondary)
                                }
                                Spacer()
                                if piatto.daControllare {
                                    Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(.orange)
                                }
                            }
                        }
                    }
                    .onDelete { sezione.piatti.remove(atOffsets: $0) }
                } header: {
                    TextField("Sezione", text: $sezione.sezione)
                }
            }

            if !anteprima.carta.isEmpty {
                Section("Carta bevande (\(anteprima.carta.count))") {
                    ForEach($anteprima.carta) { $b in
                        HStack {
                            TextField("Nome", text: $b.nome)
                            TextField("€", value: $b.prezzo, format: .number)
                                .keyboardType(.decimalPad).multilineTextAlignment(.trailing).frame(width: 70)
                        }
                    }
                    .onDelete { anteprima.carta.remove(atOffsets: $0) }
                }
            }

            Section {
                Toggle("Ho controllato prezzi e allergeni: il menù è corretto", isOn: $confermato)
                Button(salvato ? "Salvato ✓" : "Salva menù e carta") { salva() }
                    .disabled(!confermato || salvataggio || salvato)
                if let errore { Text(errore).foregroundStyle(.red) }
            } footer: {
                Text("Dopo il salvataggio, dal pannello \"Abbinamenti\" premi Ricalcola: i piatti ricevono il profilo per i consigli sui vini.")
            }
        }
        .navigationTitle("Controlla il menù")
    }

    private func salva() {
        salvataggio = true
        errore = nil
        Task {
            defer { salvataggio = false }
            do { try await service.conferma(anteprima); salvato = true }
            catch { errore = error.localizedDescription }
        }
    }
}

struct PiattoEditor: View {
    @Binding var piatto: Piatto

    var body: some View {
        Form {
            Section("Piatto") {
                TextField("Nome", text: $piatto.nome)
                TextField("Descrizione", text: $piatto.descrizione, axis: .vertical)
                TextField("Prezzo €", value: $piatto.prezzo, format: .number).keyboardType(.decimalPad)
            }
            Section {
                ForEach(Allergene.allCases) { a in
                    Toggle(a.nome, isOn: Binding(
                        get: { piatto.allergeni.contains(a.rawValue) },
                        set: { on in
                            if on { piatto.allergeni.append(a.rawValue) } else { piatto.allergeni.removeAll { $0 == a.rawValue } }
                        }
                    ))
                }
            } header: {
                Text("Allergeni")
            } footer: {
                Text("L'AI riporta solo gli allergeni scritti nel menù originale e non li deduce dagli ingredienti: verifica tu ogni piatto.")
            }
        }
        .navigationTitle(piatto.nome)
    }
}
