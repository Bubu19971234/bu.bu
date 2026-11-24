import SwiftUI

/// Revisione obbligatoria prima della pubblicazione: l'AI può sbagliare prezzi e allergeni,
/// e la responsabilità verso il cliente (Reg. UE 1169/2011) resta del ristoratore.
struct MenuReviewView: View {
    @State var menu: Menu
    let resolvedFrom: String
    @State private var confirmed = false
    @State private var showPreview = false

    private var itemsNeedingAttention: Int {
        menu.sections.flatMap(\.items).filter(\.needsAttention).count
    }

    var body: some View {
        List {
            Section {
                TextField("Nome del locale", text: $menu.restaurantName)
                LabeledContent("Fonte", value: resolvedFrom).font(.caption)
                if itemsNeedingAttention > 0 {
                    Label("\(itemsNeedingAttention) voci da controllare (prezzo mancante, lettura incerta o allergeni non dichiarati)",
                          systemImage: "exclamationmark.triangle.fill")
                        .foregroundStyle(.orange)
                }
                ForEach(menu.extractionWarnings, id: \.self) { warning in
                    Label(warning, systemImage: "exclamationmark.circle").foregroundStyle(.orange)
                }
            }

            ForEach($menu.sections) { $section in
                Section {
                    ForEach($section.items) { $item in
                        NavigationLink {
                            MenuItemEditor(item: $item, currency: menu.currency)
                        } label: {
                            HStack {
                                VStack(alignment: .leading) {
                                    Text(item.name)
                                    Text(item.prices.map { $0.formatted(currency: menu.currency) }.joined(separator: " · "))
                                        .font(.caption).foregroundStyle(.secondary)
                                }
                                Spacer()
                                if item.needsAttention {
                                    Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(.orange)
                                }
                            }
                        }
                    }
                    .onDelete { section.items.remove(atOffsets: $0) }
                } header: {
                    TextField("Sezione", text: $section.title)
                }
            }

            Section {
                Toggle("Ho controllato prezzi e allergeni: il menu è corretto", isOn: $confirmed)
                Button("Anteprima e pubblica") { showPreview = true }
                    .disabled(!confirmed)
            }
        }
        .navigationTitle("Revisione menu")
        .navigationDestination(isPresented: $showPreview) {
            MenuLayoutView(menu: menu, theme: .classico)
        }
    }
}

struct MenuItemEditor: View {
    @Binding var item: MenuItem
    let currency: String

    var body: some View {
        Form {
            if !item.uncertainty.isEmpty {
                Section("Dubbio di lettura") { Text(item.uncertainty).foregroundStyle(.orange) }
            }
            Section("Voce") {
                TextField("Nome", text: $item.name)
                TextField("Descrizione", text: $item.description, axis: .vertical)
            }
            Section("Prezzi (centesimi)") {
                ForEach(item.prices.indices, id: \.self) { i in
                    HStack {
                        TextField("Etichetta", text: $item.prices[i].label)
                        TextField("Centesimi", value: $item.prices[i].amountCents, format: .number)
                            .keyboardType(.numberPad).multilineTextAlignment(.trailing)
                    }
                }
                Button("Aggiungi prezzo") { item.prices.append(Price(amountCents: 0, label: "")) }
            }
            Section {
                ForEach(Allergen.allCases) { allergen in
                    Toggle(allergen.label, isOn: Binding(
                        get: { item.allergens.contains(allergen) },
                        set: { on in
                            item.allergensDeclared = true
                            if on { item.allergens.append(allergen) } else { item.allergens.removeAll { $0 == allergen } }
                        }
                    ))
                }
            } header: {
                Text("Allergeni")
            } footer: {
                Text(item.allergensDeclared
                     ? "Allergeni confermati."
                     : "Il menu originale non dichiarava allergeni per questa voce: inseriscili tu. L'AI non li deduce dagli ingredienti.")
            }
            Section("Testo originale") { Text(item.sourceText).font(.caption).foregroundStyle(.secondary) }
        }
        .navigationTitle(item.name)
    }
}
