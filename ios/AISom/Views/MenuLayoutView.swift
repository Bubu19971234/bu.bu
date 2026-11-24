import SwiftUI

/// Layout "ad hoc" del menu per il cliente finale, personalizzabile per locale tramite MenuTheme.
struct MenuTheme {
    var background: Color
    var surface: Color
    var accent: Color
    var text: Color
    var secondaryText: Color
    var titleFont: Font
    var itemFont: Font
    var bodyFont: Font

    static let classico = MenuTheme(
        background: Color(red: 0.98, green: 0.96, blue: 0.92),
        surface: .white,
        accent: Color(red: 0.45, green: 0.09, blue: 0.16), // bordeaux
        text: Color(red: 0.13, green: 0.11, blue: 0.10),
        secondaryText: Color(red: 0.40, green: 0.36, blue: 0.33),
        titleFont: .system(.largeTitle, design: .serif).weight(.semibold),
        itemFont: .system(.headline, design: .serif),
        bodyFont: .system(.subheadline, design: .default)
    )

    static let moderno = MenuTheme(
        background: Color(white: 0.07),
        surface: Color(white: 0.12),
        accent: Color(red: 0.85, green: 0.70, blue: 0.40), // oro
        text: .white,
        secondaryText: Color(white: 0.65),
        titleFont: .system(.largeTitle, design: .rounded).weight(.bold),
        itemFont: .system(.headline, design: .rounded),
        bodyFont: .system(.subheadline, design: .rounded)
    )
}

struct MenuLayoutView: View {
    let anteprima: Anteprima
    let theme: MenuTheme

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    sectionChips(proxy: proxy)
                    ForEach(anteprima.menu) { sezione in
                        sectionView(sezione).id(sezione.id)
                    }
                    if !anteprima.carta.isEmpty { cartaView }
                    Text("Per informazioni su allergeni e intolleranze rivolgiti al personale.")
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(theme.secondaryText)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 16)
            }
            .background(theme.background.ignoresSafeArea())
        }
        .navigationTitle("Anteprima")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func sectionChips(proxy: ScrollViewProxy) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(anteprima.menu) { sezione in
                    Button(sezione.sezione) { withAnimation { proxy.scrollTo(sezione.id, anchor: .top) } }
                        .font(.subheadline.weight(.medium))
                        .padding(.horizontal, 14).padding(.vertical, 8)
                        .background(Capsule().fill(theme.surface))
                        .overlay(Capsule().stroke(theme.accent.opacity(0.4)))
                        .foregroundStyle(theme.accent)
                }
            }
        }
    }

    private func titolo(_ t: String) -> some View {
        Text(t.uppercased()).font(.caption.weight(.bold)).tracking(2).foregroundStyle(theme.accent)
    }

    private func sectionView(_ sezione: Sezione) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            titolo(sezione.sezione)
            ForEach(sezione.piatti) { piatto in
                VStack(alignment: .leading, spacing: 6) {
                    HStack(alignment: .firstTextBaseline) {
                        Text(piatto.nome).font(theme.itemFont).foregroundStyle(theme.text)
                        Spacer(minLength: 12)
                        if piatto.prezzo > 0 {
                            Text(piatto.prezzo.euro).font(.subheadline.monospacedDigit()).foregroundStyle(theme.text)
                        }
                    }
                    if !piatto.descrizione.isEmpty {
                        Text(piatto.descrizione).font(theme.bodyFont).foregroundStyle(theme.secondaryText)
                    }
                    if !piatto.allergeni.isEmpty {
                        Text("Allergeni: " + piatto.allergeni.compactMap { Allergene(rawValue: $0)?.nome }.joined(separator: ", "))
                            .font(.caption2).foregroundStyle(theme.secondaryText)
                    }
                }
                .padding(14)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(RoundedRectangle(cornerRadius: 12).fill(theme.surface))
            }
        }
    }

    private var cartaView: some View {
        VStack(alignment: .leading, spacing: 12) {
            titolo("Carta bevande")
            ForEach(anteprima.carta) { b in
                HStack(alignment: .firstTextBaseline) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(b.nome).font(theme.itemFont).foregroundStyle(theme.text)
                        let det = [b.cantina, b.annata, b.colore.capitalized].filter { !$0.isEmpty }.joined(separator: " · ")
                        if !det.isEmpty { Text(det).font(.caption).foregroundStyle(theme.secondaryText) }
                    }
                    Spacer(minLength: 12)
                    if b.prezzo > 0 { Text(b.prezzo.euro).font(.subheadline.monospacedDigit()).foregroundStyle(theme.text) }
                }
                .padding(14)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(RoundedRectangle(cornerRadius: 12).fill(theme.surface))
            }
        }
    }
}
