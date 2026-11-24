import Foundation

/// Specchio dell'anteprima di ai-som-saas `POST /api/onboarding-import`.
/// L'anteprima NON è salvata: lo diventa solo con la conferma del ristoratore.
struct AnteprimaResponse: Decodable {
    let ok: Bool
    var anteprima: Anteprima
}

struct Anteprima: Codable, Equatable {
    var menu: [Sezione]
    var carta: [Bevanda]
}

struct Sezione: Codable, Equatable, Identifiable {
    var id = UUID()
    var sezione: String
    var piatti: [Piatto]
    private enum CodingKeys: String, CodingKey { case sezione, piatti }
}

struct Piatto: Codable, Equatable, Identifiable {
    var id = UUID()
    var nome: String
    var descrizione: String
    /// In euro (es. 12.5). 0 = prezzo non letto.
    var prezzo: Double
    /// Codici UE "1"…"14" (Reg. 1169/2011). Lista vuota = nessun allergene DICHIARATO nel menù.
    var allergeni: [String]
    private enum CodingKeys: String, CodingKey { case nome, descrizione, prezzo, allergeni }

    var daControllare: Bool { prezzo == 0 || allergeni.isEmpty }
}

struct Bevanda: Codable, Equatable, Identifiable {
    var id = UUID()
    var nome: String
    var cantina: String
    var annata: String
    var prezzo: Double
    /// vino | cocktail | birra | analcolico | amaro
    var tipo: String
    /// ROSSO | BIANCO | ROSÈ | BOLLICINE | "" (solo vini)
    var colore: String
    private enum CodingKeys: String, CodingKey { case nome, cantina, annata, prezzo, tipo, colore }
}

/// I 14 allergeni dell'Allegato II Reg. UE 1169/2011, con il codice usato nel database.
enum Allergene: String, CaseIterable, Identifiable {
    case glutine = "1", crostacei = "2", uova = "3", pesce = "4", arachidi = "5", soia = "6", latte = "7"
    case fruttaAGuscio = "8", sedano = "9", senape = "10", sesamo = "11", solfiti = "12", lupini = "13", molluschi = "14"

    var id: String { rawValue }
    var nome: String {
        switch self {
        case .glutine: "Glutine"; case .crostacei: "Crostacei"; case .uova: "Uova"; case .pesce: "Pesce"
        case .arachidi: "Arachidi"; case .soia: "Soia"; case .latte: "Latte"; case .fruttaAGuscio: "Frutta a guscio"
        case .sedano: "Sedano"; case .senape: "Senape"; case .sesamo: "Sesamo"; case .solfiti: "Solfiti"
        case .lupini: "Lupini"; case .molluschi: "Molluschi"
        }
    }
}

extension Double {
    var euro: String { formatted(.currency(code: "EUR")) }
}
