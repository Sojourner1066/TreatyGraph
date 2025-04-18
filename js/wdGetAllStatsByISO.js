/**
 * Fetches population, HDI/IHDI, and GDP statistics from Wikidata
 * for all countries using ISO 3166-1 alpha-3 codes.
 * Returns full results from the SPARQL endpoint.
 */
export async function wdGetAllStatsByISO(iso3 = "NGA") {
    const query = `
      SELECT ?country ?countryLabel ?isoCode ?population ?ihdi ?hdi ?gdp ?gdpYear WHERE {
        VALUES ?isoCode {
          "AFG" "ALA" "ALB" "DZA" "ASM" "AND" "AGO" "AIA" "ATA" "ATG" "ARG" "ARM" "ABW" "AUS" "AUT" "AZE"
          "BHS" "BHR" "BGD" "BRB" "BLR" "BEL" "BLZ" "BEN" "BMU" "BTN" "BOL" "BES" "BIH" "BWA" "BVT" "BRA"
          "IOT" "BRN" "BGR" "BFA" "BDI" "CPV" "KHM" "CMR" "CAN" "CYM" "CAF" "TCD" "CHL" "CHN" "CXR" "CCK"
          "COL" "COM" "COG" "COD" "COK" "CRI" "CIV" "HRV" "CUB" "CUW" "CYP" "CZE" "DNK" "DJI" "DMA" "DOM"
          "ECU" "EGY" "SLV" "GNQ" "ERI" "EST" "SWZ" "ETH" "FLK" "FRO" "FJI" "FIN" "FRA" "GUF" "PYF" "ATF"
          "GAB" "GMB" "GEO" "DEU" "GHA" "GIB" "GRC" "GRL" "GRD" "GLP" "GUM" "GTM" "GGY" "GIN" "GNB" "GUY"
          "HTI" "HMD" "VAT" "HND" "HKG" "HUN" "ISL" "IND" "IDN" "IRN" "IRQ" "IRL" "IMN" "ISR" "ITA" "JAM"
          "JPN" "JEY" "JOR" "KAZ" "KEN" "KIR" "PRK" "KOR" "KWT" "KGZ" "LAO" "LVA" "LBN" "LSO" "LBR" "LBY"
          "LIE" "LTU" "LUX" "MAC" "MDG" "MWI" "MYS" "MDV" "MLI" "MLT" "MHL" "MTQ" "MRT" "MUS" "MYT" "MEX"
          "FSM" "MDA" "MCO" "MNG" "MNE" "MSR" "MAR" "MOZ" "MMR" "NAM" "NRU" "NPL" "NLD" "NCL" "NZL" "NIC"
          "NER" "NGA" "NIU" "NFK" "MKD" "MNP" "NOR" "OMN" "PAK" "PLW" "PSE" "PAN" "PNG" "PRY" "PER" "PHL"
          "PCN" "POL" "PRT" "PRI" "QAT" "REU" "ROU" "RUS" "RWA" "BLM" "SHN" "KNA" "LCA" "MAF" "SPM" "VCT"
          "WSM" "SMR" "STP" "SAU" "SEN" "SRB" "SYC" "SLE" "SGP" "SXM" "SVK" "SVN" "SLB" "SOM" "ZAF" "SGS"
          "SSD" "ESP" "LKA" "SDN" "SUR" "SJM" "SWE" "CHE" "SYR" "TWN" "TJK" "TZA" "THA" "TLS" "TGO" "TKL"
          "TON" "TTO" "TUN" "TUR" "TKM" "TCA" "TUV" "UGA" "UKR" "ARE" "GBR" "USA" "UMI" "URY" "UZB" "VUT"
          "VEN" "VNM" "VGB" "VIR" "WLF" "ESH" "YEM" "ZMB" "ZWE"
        }
  
        ?country wdt:P298 ?isoCode.
  
        OPTIONAL {
          ?country p:P1082 ?popStatement.
          ?popStatement ps:P1082 ?population.
          ?popStatement wikibase:rank wikibase:PreferredRank.
        }
  
        OPTIONAL {
          ?country p:P11593 ?ihdiStatement.
          ?ihdiStatement ps:P11593 ?ihdi.
          ?ihdiStatement wikibase:rank wikibase:PreferredRank.
        }
  
        OPTIONAL {
          ?country p:P1081 ?hdiStatement.
          ?hdiStatement ps:P1081 ?hdi.
          ?hdiStatement wikibase:rank wikibase:PreferredRank.
        }
  
        OPTIONAL {
          {
            SELECT ?country (MAX(?gdpDate) AS ?latestGdpDate) WHERE {
              ?country p:P2131 ?gdpStmt.
              ?gdpStmt pq:P585 ?gdpDate.
            }
            GROUP BY ?country
          }
  
          ?country p:P2131 ?gdpStmt.
          ?gdpStmt ps:P2131 ?gdp.
          ?gdpStmt pq:P585 ?gdpYear.
          FILTER(?gdpYear = ?latestGdpDate)
        }
  
        SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
      }
    `;
  
    const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`;
  
    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching data:", error);
      return null;
    }
  }