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
    let menu: Menu
    let theme: MenuTheme
    @State private var selectedSection: MenuSection.ID?

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    Text(menu.restaurantName)
                        .font(theme.titleFont)
                        .foregroundStyle(theme.text)
                        .frame(maxWidth: .infinity)
                        .padding(.top, 8)

                    sectionChips(proxy: proxy)

                    ForEach(menu.sections) { section in
                        sectionView(section).id(section.id)
                    }

                    if !menu.notes.isEmpty {
                        VStack(alignment: .leading, spacing: 6) {
                            ForEach(menu.notes, id: \.self) { Text($0) }
                        }
                        .font(.footnote)
                        .foregroundStyle(theme.secondaryText)
                    }

                    Text("Per informazioni su allergeni e intolleranze rivolgiti al personale.")
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(theme.secondaryText)
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 32)
            }
            .background(theme.background.ignoresSafeArea())
        }
        .navigationBarTitleDisplayMode(.inline)
    }

    private func sectionChips(proxy: ScrollViewProxy) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(menu.sections) { section in
                    Button(section.title) {
                        withAnimation { proxy.scrollTo(section.id, anchor: .top) }
                    }
                    .font(.subheadline.weight(.medium))
                    .padding(.horizontal, 14).padding(.vertical, 8)
                    .background(Capsule().fill(theme.surface))
                    .overlay(Capsule().stroke(theme.accent.opacity(0.4)))
                    .foregroundStyle(theme.accent)
                }
            }
        }
    }

    private func sectionView(_ section: MenuSection) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(section.title.uppercased())
                .font(.caption.weight(.bold))
                .tracking(2)
                .foregroundStyle(theme.accent)
            ForEach(section.items) { item in
                itemCard(item)
            }
        }
    }

    private func itemCard(_ item: MenuItem) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .firstTextBaseline) {
                Text(item.name).font(theme.itemFont).foregroundStyle(theme.text)
                Spacer(minLength: 12)
                VStack(alignment: .trailing, spacing: 2) {
                    ForEach(item.prices, id: \.self) { price in
                        Text([price.label, price.formatted(currency: menu.currency)]
                                .filter { !$0.isEmpty }.joined(separator: " "))
                            .font(.subheadline.monospacedDigit())
                            .foregroundStyle(theme.text)
                    }
                }
            }
            if item.kind == .vino {
                let details = [item.wine.producer, item.wine.region, item.wine.vintage, item.wine.grapes]
                    .filter { !$0.isEmpty }.joined(separator: " · ")
                if !details.isEmpty {
                    Text(details).font(.caption).foregroundStyle(theme.secondaryText)
                }
            }
            if !item.description.isEmpty {
                Text(item.description).font(theme.bodyFont).foregroundStyle(theme.secondaryText)
            }
            if !item.allergens.isEmpty {
                Text("Allergeni: " + item.allergens.map(\.label).joined(separator: ", "))
                    .font(.caption2)
                    .foregroundStyle(theme.secondaryText)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 12).fill(theme.surface))
    }
}
