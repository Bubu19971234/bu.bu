import Foundation

/// Specchio dello schema JSON del backend (backend/src/schema.ts).
/// Il decoder usa .convertFromSnakeCase, quindi `restaurant_name` -> `restaurantName`.

struct MenuImportResponse: Decodable {
    var menu: Menu
    let model: String
    let resolvedFrom: String
    let needsReview: Bool
}

struct Menu: Codable, Equatable {
    var restaurantName: String
    var currency: String
    var language: String
    var sections: [MenuSection]
    var notes: [String]
    var extractionWarnings: [String]
}

struct MenuSection: Codable, Equatable, Identifiable {
    var id = UUID()
    var title: String
    var items: [MenuItem]

    private enum CodingKeys: String, CodingKey { case title, items }
}

struct MenuItem: Codable, Equatable, Identifiable {
    var id = UUID()
    var name: String
    var description: String
    var kind: Kind
    var prices: [Price]
    var allergens: [Allergen]
    var allergensDeclared: Bool
    var tags: [String]
    var wine: Wine
    var sourceText: String
    var uncertainty: String

    enum Kind: String, Codable { case piatto, vino, bevanda, altro }

    private enum CodingKeys: String, CodingKey {
        case name, description, kind, prices, allergens, allergensDeclared, tags, wine, sourceText, uncertainty
    }

    /// Voce da far controllare al ristoratore prima della pubblicazione.
    var needsAttention: Bool { !uncertainty.isEmpty || prices.isEmpty || (kind == .piatto && !allergensDeclared) }
}

struct Price: Codable, Equatable, Hashable {
    var amountCents: Int
    var label: String

    func formatted(currency: String) -> String {
        let value = Decimal(amountCents) / 100
        return value.formatted(.currency(code: currency.isEmpty ? "EUR" : currency))
    }
}

struct Wine: Codable, Equatable {
    var producer: String
    var vintage: String
    var region: String
    var grapes: String
    var color: WineColor

    enum WineColor: String, Codable { case rosso, bianco, rosato, bollicine, dolce, nonIndicato = "non_indicato" }
}

/// I 14 allergeni dell'Allegato II Reg. UE 1169/2011.
enum Allergen: String, Codable, CaseIterable, Identifiable {
    case glutine, crostacei, uova, pesce, arachidi, soia, latte
    case fruttaAGuscio = "frutta_a_guscio"
    case sedano, senape, sesamo, solfiti, lupini, molluschi

    var id: String { rawValue }
    var label: String {
        switch self {
        case .fruttaAGuscio: "Frutta a guscio"
        default: rawValue.capitalized
        }
    }
}
