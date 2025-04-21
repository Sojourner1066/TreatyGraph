export async function getAllCountryMemberships() {
    const query = `
        SELECT ?country ?countryLabel ?isoCode ?organization ?organizationLabel ?officialWebsite ?organizationDescription WHERE {
            VALUES ?isoCode { "AFG" "ALA" "ALB" "DZA" "ASM" "AND" "AGO" "AIA" "ATA" "ATG" "ARG" "ARM" "ABW" "AUS" "AUT" "AZE"
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
                    "VEN" "VNM" "VGB" "VIR" "WLF" "ESH" "YEM" "ZMB" "ZWE" }
            ?country wdt:P298 ?isoCode.
            ?country wdt:P463 ?organization.
            OPTIONAL { ?organization wdt:P856 ?officialWebsite. }
            OPTIONAL {
                ?organization schema:description ?organizationDescription.
                FILTER(LANG(?organizationDescription) = "en")
            }

            SERVICE wikibase:label {
                bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en".
            }
            }
    `;
    const url = 'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(query);
    const response = await fetch(url);
    const data = await response.json();
    const grouppedData = groupByOrganization(data)
    console.log(grouppedData);
    return grouppedData; 
}


function groupByOrganization(sparqlResults) {
    const grouped = {};

    sparqlResults.results.bindings.forEach(item => {
        const orgId = item.organization.value.split('/').pop(); // e.g., Q1065
        const orgLabel = item.organizationLabel.value;
        const countryCode = item.isoCode.value;

        if (!grouped[orgId]) {
            grouped[orgId] = {
                wikidata_id: orgId,
                organization_name: orgLabel,
                memberCount: 0,
                memberCountries: [],
                officialWebsite: item.officialWebsite ? item.officialWebsite.value : null,
                description: item.organizationDescription ? item.organizationDescription.value : null
            };
        }

        if (!grouped[orgId].memberCountries.includes(countryCode)) {
            grouped[orgId].memberCountries.push(countryCode);
            grouped[orgId].memberCount++;
        }
    });

    return Object.values(grouped);
}