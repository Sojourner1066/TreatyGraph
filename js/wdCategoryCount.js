/**
 * Fetches and counts treaty membership categories from Wikidata
 * for a given country ISO3 code and treaty groupings.
 */
export async function wdCategoryCounts(iso3 = "NGA", treatyCountryGroups = {}) {
  const treatyNames = new Set(Object.keys(treatyCountryGroups));

  const query = `
    SELECT ?country ?countryLabel ?membership ?membershipLabel ?MembershipType ?MembershipTypeLabel WHERE {
      ?country wdt:P298 "${iso3}".
      ?country wdt:P463 ?membership.
      OPTIONAL {
        ?membership wdt:P31 ?MembershipType.
      }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
    }
    ORDER BY ?membershipLabel
  `;

  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });

    const data = await response.json();
    const rawData = data.results.bindings;

    // Filter for treaties matching input groups
    const filteredData = rawData.filter(entry =>
      entry.membershipLabel && treatyNames.has(entry.membershipLabel.value)
    );

    return getUniqueMembershipTypes(filteredData);
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
}

/**
 * Extracts unique Wikidata entity IDs for membership types
 * and maps them into summarized category counts.
 */
function getUniqueMembershipTypes(data) {
  const types = new Set();

  data.forEach(entry => {
    if (entry.MembershipType) {
      types.add(entry.MembershipType.value.replace("http://www.wikidata.org/entity/", ""));
    }
  });

  const categories = countCategoriesFromIDs(Array.from(types).sort());
  return categories;
}

/**
 * Maps Wikidata entity IDs to higher-level categories and counts them
 */
export function countCategoriesFromIDs(wikidataIDs) {
  const categoryCounts = {};

  wikidataIDs.forEach(id => {
    const category = wikidataCategoryMap[id] || "Uncategorized";
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  return categoryCounts;
}

/**
 * Map of specific Wikidata entity IDs to broad treaty organization categories
 */
const wikidataCategoryMap = {
  // Cultural/Educational
  "Q10549978": "Cultural/Educational",
  "Q10855469": "Cultural/Educational",
  "Q1149061": "Cultural/Educational",
  "Q2093358": "Cultural/Educational",
  "Q2385804": "Cultural/Educational",
  "Q3502482": "Cultural/Educational",
  "Q96888669": "Cultural/Educational",

  // Economic/Trade Organizations
  "Q105758271": "Economic/Trade Organizations",
  "Q1125321": "Economic/Trade Organizations",
  "Q1129645": "Economic/Trade Organizations",
  "Q129060826": "Economic/Trade Organizations",
  "Q1327750": "Economic/Trade Organizations",
  "Q1345691": "Economic/Trade Organizations",
  "Q218819": "Economic/Trade Organizations",
  "Q252550": "Economic/Trade Organizations",
  "Q3536928": "Economic/Trade Organizations",
  "Q3623811": "Economic/Trade Organizations",
  "Q5335686": "Economic/Trade Organizations",

  // Environmental
  "Q1785733": "Environmental",
  "Q3356081": "Environmental",

  // General International Orgs
  "Q163740": "General International Orgs",
  "Q17084016": "General International Orgs",
  "Q1900326": "General International Orgs",
  "Q29300714": "General International Orgs",
  "Q431603": "General International Orgs",
  "Q43229": "General International Orgs",
  "Q48204": "General International Orgs",
  "Q6815100": "General International Orgs",
  "Q728646": "General International Orgs",
  "Q79913": "General International Orgs",
  "Q9378718": "General International Orgs",
  "Q938236": "General International Orgs",

  // Intergovernmental Organizations (IGOs)
  "Q1335818": "Intergovernmental Organizations (IGOs)",
  "Q15285626": "Intergovernmental Organizations (IGOs)",
  "Q15925165": "Intergovernmental Organizations (IGOs)",
  "Q245065": "Intergovernmental Organizations (IGOs)",
  "Q4120211": "Intergovernmental Organizations (IGOs)",
  "Q484652": "Intergovernmental Organizations (IGOs)",
  "Q97374157": "Intergovernmental Organizations (IGOs)",

  // Military Alliances
  "Q100906234": "Military Alliances",
  "Q1127126": "Military Alliances",
  "Q115365853": "Military Alliances",
  "Q125420442": "Military Alliances",
  "Q1276346": "Military Alliances",
  "Q1772543": "Military Alliances",

  // Political Alliances
  "Q1140229": "Political Alliances",
  "Q120121699": "Political Alliances",
  "Q124964": "Political Alliances",
  "Q170156": "Political Alliances",
  "Q2578692": "Political Alliances",
  "Q7210356": "Political Alliances",
  "Q769802": "Political Alliances",

  // Religious or Ideological
  "Q110706912": "Religious or Ideological",

  // Scientific & Technical
  "Q109909183": "Scientific & Technical",
  "Q1254933": "Scientific & Technical",
  "Q1328899": "Scientific & Technical",
  "Q1438053": "Scientific & Technical",
  "Q31855": "Scientific & Technical",
  "Q4117139": "Scientific & Technical",
  "Q480242": "Scientific & Technical",
  "Q5227240": "Scientific & Technical",
  "Q6043746": "Scientific & Technical",
  "Q7689673": "Scientific & Technical",

  // Sports Organizations
  "Q11422536": "Sports Organizations"
};