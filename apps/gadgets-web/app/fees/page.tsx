import { SITE } from "../site";
export const metadata = { title: "Fees" };
const rows =
  SITE.vertical === "cars"
    ? [
        ["Vehicle Buy Now price", "As listed; passed through"],
        ["Auction buyer fee", "Set by the auction; passed through"],
        [
          "Auction platform service fee",
          "$195 (under $3,000) / $295 (from $3,000); passed through",
        ],
        ["Title & documentation courier", "$95; passed through"],
        ["Inland + ocean shipping", "Quoted per car (RoRo or container)"],
        [
          "Cedarce service fee",
          "$350 under $5,000 · $500 from $5,000 to $15,000 · 4% above $15,000",
        ],
        ["Independent inspection (optional)", "$200"],
        ["Customs duty, levies, VAT", "Estimated on the listing; invoiced at actuals by customs"],
      ]
    : [
        ["Retail price", "Live US retail price"],
        ["US sales tax", "About 8%"],
        ["Air freight & forwarding", "From $18, by weight"],
        ["Duty & VAT", "Estimated; invoiced at actuals"],
        ["Cedarce service", "Included in the displayed price (12–30% by category)"],
      ];
export default function Fees() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">Fees</h1>
      <p className="mt-2 text-gray-600">
        No hidden lines. Every quote we send shows each of these.
      </p>
      <table className="mt-6 w-full text-sm">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-b">
              <td className="py-2 font-medium">{k}</td>
              <td className="py-2 text-gray-600">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
