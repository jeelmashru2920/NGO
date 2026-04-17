const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ─── DATABASE SETUP ─────────────────────────────────────────────────────────
const db = new sqlite3.Database(path.join(__dirname, "ngo.db"), (err) => {
    if (err) console.error("Database opening error:", err.message);
});

db.serialize(() => {
    // Create Tables
    db.run(`CREATE TABLE IF NOT EXISTS donors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        city TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS donations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        donor_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        purpose TEXT NOT NULL,
        payment_mode TEXT DEFAULT 'Online',
        donated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (donor_id) REFERENCES donors(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS volunteers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        skills TEXT,
        city TEXT,
        status TEXT DEFAULT 'Active',
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        location TEXT,
        event_date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS activity_volunteers (
        activity_id INTEGER,
        volunteer_id INTEGER,
        PRIMARY KEY (activity_id, volunteer_id),
        FOREIGN KEY (activity_id) REFERENCES activities(id),
        FOREIGN KEY (volunteer_id) REFERENCES volunteers(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS fund_utilization (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        activity_id INTEGER,
        utilized_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (activity_id) REFERENCES activities(id)
    )`);

    // ─── SEED DEMO DATA ──────────────────────────────────────────────────────
    db.get("SELECT COUNT(*) as c FROM donors", (err, row) => {
        if (row && row.c === 0) {
            console.log("Seeding initial data...");

            const iD = db.prepare("INSERT INTO donors (name,email,phone,city) VALUES (?,?,?,?)");
            const iDon = db.prepare("INSERT INTO donations (donor_id,amount,purpose,payment_mode,donated_at) VALUES (?,?,?,?,?)");
            const iV = db.prepare("INSERT INTO volunteers (name,email,phone,skills,city,status) VALUES (?,?,?,?,?,?)");
            const iA = db.prepare("INSERT INTO activities (title,description,category,location,event_date) VALUES (?,?,?,?,?)");
            const iF = db.prepare("INSERT INTO fund_utilization (category,amount,description,utilized_at) VALUES (?,?,?,?)");
            const iAV = db.prepare("INSERT INTO activity_volunteers (activity_id,volunteer_id) VALUES (?,?)");

            [
                ["Aarav Shah", "aarav@example.com", "9876543210", "Mumbai"],
                ["Priya Mehta", "priya@example.com", "9123456789", "Pune"],
                ["Rohan Joshi", "rohan@example.com", "9988776655", "Delhi"],
                ["Sunita Patel", "sunita@example.com", "9765432109", "Ahmedabad"],
                ["Vikram Nair", "vikram@example.com", "9654321098", "Bangalore"],
                ["Meera Iyer", "meera@example.com", "9543210987", "Chennai"],
            ].forEach(d => iD.run(...d));

            [
                [1, 5000, "Education", "UPI", "2024-01-15"], [2, 12000, "Healthcare", "Bank Transfer", "2024-02-20"],
                [3, 8000, "Food Drive", "Online", "2024-03-10"], [4, 25000, "Education", "Cheque", "2024-03-25"],
                [5, 3500, "Environment", "UPI", "2024-04-05"], [6, 15000, "Healthcare", "Online", "2024-04-18"],
                [1, 7000, "Food Drive", "UPI", "2024-05-01"], [2, 9500, "Education", "Bank Transfer", "2024-05-15"],
                [3, 4000, "Environment", "Online", "2024-06-01"], [4, 18000, "Healthcare", "Cheque", "2024-06-20"],
            ].forEach(d => iDon.run(...d));

            [
                ["Ananya Desai", "ananya@example.com", "9871234560", "Teaching, Coding", "Mumbai", "Active"],
                ["Karan Singh", "karan@example.com", "9762345671", "Medical, First Aid", "Delhi", "Active"],
                ["Divya Rao", "divya@example.com", "9653456782", "Event Management", "Pune", "Active"],
                ["Siddharth Kumar", "sid@example.com", "9544567893", "Photography", "Bangalore", "Inactive"],
                ["Neha Gupta", "neha@example.com", "9435678904", "Counseling, Teaching", "Mumbai", "Active"],
            ].forEach(v => iV.run(...v));

            [
                ["Clean India Drive", "Community cleanliness campaign", "Environment", "Juhu Beach, Mumbai", "2024-03-22"],
                ["Health Camp", "Free medical checkup for underprivileged", "Healthcare", "Dharavi, Mumbai", "2024-04-07"],
                ["Teach for Change", "Weekend teaching sessions for kids", "Education", "Govandi School, Mumbai", "2024-05-12"],
                ["Food for All", "Monthly food distribution drive", "Food", "Dharavi, Mumbai", "2024-06-01"],
                ["Tree Plantation", "Plant 500 trees initiative", "Environment", "Aarey Colony, Mumbai", "2024-07-05"],
            ].forEach(a => iA.run(...a));

            [
                ["Education", 28500, "Books, stationery, teacher fees", "2024-03-01"],
                ["Healthcare", 22000, "Medicines and equipment", "2024-04-10"],
                ["Food", 11000, "Groceries and cooking supplies", "2024-06-02"],
                ["Environment", 6500, "Saplings and tools", "2024-07-06"],
                ["Operations", 5000, "Admin, printing, transport", "2024-06-15"],
            ].forEach(f => iF.run(...f));

            [[1, 1], [1, 3], [2, 2], [2, 5], [3, 1], [3, 5], [4, 3], [4, 4], [5, 1], [5, 2]].forEach(av => iAV.run(...av));
            
            iD.finalize(); iDon.finalize(); iV.finalize(); iA.finalize(); iF.finalize(); iAV.finalize();
        }
    });
});

// ─── DONORS ──────────────────────────────────────────────────────────────────
app.get("/api/donors", (req, res) => {
    db.all(`
    SELECT d.*, COUNT(don.id) as donation_count, COALESCE(SUM(don.amount),0) as total_donated
    FROM donors d LEFT JOIN donations don ON d.id = don.donor_id
    GROUP BY d.id ORDER BY d.created_at DESC
  `, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post("/api/donors", (req, res) => {
    const { name, email, phone, city } = req.body;
    db.run("INSERT INTO donors (name,email,phone,city) VALUES (?,?,?,?)", [name, email, phone, city], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ id: this.lastID, message: "Donor added successfully" });
    });
});

app.delete("/api/donors/:id", (req, res) => {
    db.run("DELETE FROM donors WHERE id=?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Donor deleted" });
    });
});

// ─── DONATIONS ───────────────────────────────────────────────────────────────
app.get("/api/donations", (req, res) => {
    db.all(`
    SELECT don.*, d.name as donor_name, d.city as donor_city
    FROM donations don JOIN donors d ON don.donor_id = d.id
    ORDER BY don.donated_at DESC
  `, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post("/api/donations", (req, res) => {
    const { donor_id, amount, purpose, payment_mode, donated_at } = req.body;
    db.run("INSERT INTO donations (donor_id,amount,purpose,payment_mode,donated_at) VALUES (?,?,?,?,?)",
        [donor_id, amount, purpose, payment_mode, donated_at || new Date().toISOString()], function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ id: this.lastID, message: "Donation recorded" });
        });
});

app.delete("/api/donations/:id", (req, res) => {
    db.run("DELETE FROM donations WHERE id=?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Donation deleted" });
    });
});

// ─── VOLUNTEERS ──────────────────────────────────────────────────────────────
app.get("/api/volunteers", (req, res) => {
    db.all(`
    SELECT v.*, COUNT(av.activity_id) as activities_count
    FROM volunteers v LEFT JOIN activity_volunteers av ON v.id = av.volunteer_id
    GROUP BY v.id ORDER BY v.joined_at DESC
  `, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post("/api/volunteers", (req, res) => {
    const { name, email, phone, skills, city, status } = req.body;
    db.run("INSERT INTO volunteers (name,email,phone,skills,city,status) VALUES (?,?,?,?,?,?)",
        [name, email, phone, skills, city, status || "Active"], function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ id: this.lastID, message: "Volunteer registered" });
        });
});

app.put("/api/volunteers/:id", (req, res) => {
    const { status } = req.body;
    db.run("UPDATE volunteers SET status=? WHERE id=?", [status, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Volunteer updated" });
    });
});

app.delete("/api/volunteers/:id", (req, res) => {
    db.run("DELETE FROM volunteers WHERE id=?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Volunteer deleted" });
    });
});

// ─── ACTIVITIES ──────────────────────────────────────────────────────────────
app.get("/api/activities", (req, res) => {
    db.all(`
    SELECT a.*, COUNT(av.volunteer_id) as volunteer_count
    FROM activities a LEFT JOIN activity_volunteers av ON a.id = av.activity_id
    GROUP BY a.id ORDER BY a.event_date DESC
  `, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post("/api/activities", (req, res) => {
    const { title, description, category, location, event_date } = req.body;
    db.run("INSERT INTO activities (title,description,category,location,event_date) VALUES (?,?,?,?,?)",
        [title, description, category, location, event_date], function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ id: this.lastID, message: "Activity created" });
        });
});

app.post("/api/activities/:id/volunteers", (req, res) => {
    const { volunteer_id } = req.body;
    db.run("INSERT INTO activity_volunteers (activity_id,volunteer_id) VALUES (?,?)",
        [req.params.id, volunteer_id], function (err) {
            if (err) return res.status(400).json({ error: "Already assigned or invalid IDs" });
            res.json({ message: "Volunteer assigned" });
        });
});

app.delete("/api/activities/:id", (req, res) => {
    db.serialize(() => {
        db.run("DELETE FROM activity_volunteers WHERE activity_id=?", [req.params.id]);
        db.run("DELETE FROM activities WHERE id=?", [req.params.id]);
        res.json({ message: "Activity deleted" });
    });
});

// ─── FUND UTILIZATION ────────────────────────────────────────────────────────
app.get("/api/funds", (req, res) => {
    db.all(`
    SELECT f.*, a.title as activity_title
    FROM fund_utilization f LEFT JOIN activities a ON f.activity_id = a.id
    ORDER BY f.utilized_at DESC
  `, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post("/api/funds", (req, res) => {
    const { category, amount, description, activity_id } = req.body;
    db.run("INSERT INTO fund_utilization (category,amount,description,activity_id) VALUES (?,?,?,?)",
        [category, amount, description, activity_id || null], function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ id: this.lastID, message: "Fund entry added" });
        });
});

app.delete("/api/funds/:id", (req, res) => {
    db.run("DELETE FROM fund_utilization WHERE id=?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Fund entry deleted" });
    });
});

// ─── ANALYTICS ───────────────────────────────────────────────────────────────
app.get("/api/analytics", (req, res) => {
    const queries = {
        totalDonations: "SELECT COALESCE(SUM(amount),0) as total FROM donations",
        totalFundsUsed: "SELECT COALESCE(SUM(amount),0) as total FROM fund_utilization",
        totalDonors: "SELECT COUNT(*) as c FROM donors",
        totalVolunteers: "SELECT COUNT(*) as c FROM volunteers WHERE status='Active'",
        totalActivities: "SELECT COUNT(*) as c FROM activities",
        donationByPurpose: "SELECT purpose, SUM(amount) as total, COUNT(*) as count FROM donations GROUP BY purpose ORDER BY total DESC",
        donationByMonth: "SELECT strftime('%Y-%m', donated_at) as month, SUM(amount) as total FROM donations GROUP BY month ORDER BY month",
        topDonors: "SELECT d.name, d.city, COUNT(don.id) as donations, SUM(don.amount) as total FROM donors d JOIN donations don ON d.id = don.donor_id GROUP BY d.id ORDER BY total DESC LIMIT 5",
        fundByCategory: "SELECT category, SUM(amount) as total FROM fund_utilization GROUP BY category ORDER BY total DESC",
        volunteersByCity: "SELECT city, COUNT(*) as count FROM volunteers WHERE status='Active' GROUP BY city ORDER BY count DESC",
        activitiesByCategory: "SELECT category, COUNT(*) as count FROM activities GROUP BY category ORDER BY count DESC"
    };

    // Note: Because sqlite3 is async, we execute these sequentially or use promises.
    // Simplified version for demo:
    db.all(queries.donationByPurpose, (err, donationByPurpose) => {
        db.all(queries.donationByMonth, (err, donationByMonth) => {
            db.all(queries.topDonors, (err, topDonors) => {
                db.all(queries.fundByCategory, (err, fundByCategory) => {
                    db.all(queries.volunteersByCity, (err, volunteersByCity) => {
                        db.all(queries.activitiesByCategory, (err, activitiesByCategory) => {
                            db.get(queries.totalDonations, (err, dSum) => {
                                db.get(queries.totalFundsUsed, (err, fSum) => {
                                    db.get(queries.totalDonors, (err, dCount) => {
                                        db.get(queries.totalVolunteers, (err, vCount) => {
                                            db.get(queries.totalActivities, (err, aCount) => {
                                                res.json({
                                                    summary: {
                                                        totalDonations: dSum.total,
                                                        totalFundsUsed: fSum.total,
                                                        totalDonors: dCount.c,
                                                        totalVolunteers: vCount.c,
                                                        totalActivities: aCount.c,
                                                        balance: dSum.total - fSum.total
                                                    },
                                                    donationByPurpose, donationByMonth, topDonors, fundByCategory, volunteersByCity, activitiesByCategory
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

// ─── START ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`🌱 NGO App running on http://localhost:${PORT}`));