import Papa from 'papaparse';

const LIVE_CSV = 'https://docs.google.com/spreadsheets/d/10wP9TsGSrEWQUW5GDJuT2JY47h2Om3SJKQdqFOSpoy0/export?format=csv';

export async function loadFaculty() {
    let text;
    try {
        const res = await fetch(LIVE_CSV);
        if (!res.ok) throw new Error('Failed to fetch live data');
        text = await res.text();
    } catch (err) {
        console.warn('Live fetch failed, falling back to local CSV:', err);
        const res = await fetch('/awards.csv');
        text = await res.text();
    }

    const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });

    // Group rows by email — one entry per faculty
    const grouped = new Map();
    data.forEach(row => {
        const email = (row['gmu email/userid'] || '').trim();
        if (!email) return;

        if (!grouped.has(email)) {
            grouped.set(email, {
                firstName: (row['First Name'] || '').trim(),
                lastName: (row['Last Name'] || '').trim(),
                email,
                awards: [],
            });
        }

        const award = (row['Award'] || '').trim();
        if (award && award.toLowerCase() !== 'null') {
            grouped.get(email).awards.push(award);
        }
    });

    const faculty = Array.from(grouped.values());

    // Build award index
    const awardIndex = new Map();
    faculty.forEach(f => {
        f.awards.forEach(award => {
            if (!awardIndex.has(award)) awardIndex.set(award, []);
            awardIndex.get(award).push(f);
        });
    });

    return { faculty, awardIndex };
}
