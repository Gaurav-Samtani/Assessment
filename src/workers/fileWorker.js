const { parentPort, workerData } = require("worker_threads");
const fs = require("fs");
const csvParser = require("csv-parser");
const mongoose = require("mongoose");

const Agent = require("../models/Agent");
const User = require("../models/User");
const Account = require("../models/Account");
const Lob = require("../models/Lob");
const Carrier = require("../models/Carrier");
const Policy = require("../models/Policy");

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);

// Worker main function
async function processFile(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row) => rows.push(row))
      .on("end", async () => {
        console.log(`✅ Parsed ${rows.length} rows from CSV`);

        let inserted = 0;
        for (const r of rows) {
          try {
            // ===== AGENT =====
            let agentDoc = null;
            if (r["agent"]) {
              agentDoc = await Agent.findOneAndUpdate(
                { name: r["agent"] },
                { name: r["agent"] },
                { upsert: true, new: true }
              );
            }

            // ===== USER =====
            const userPayload = {
              firstName: r["firstname"] || null,
              dob: r["dob"] ? new Date(r["dob"]) : null,
              address: r["address"] || null,
              phone: r["phone"] ? String(r["phone"]) : null,
              state: r["state"] || null,
              zipCode: r["zip"] || null,
              email: r["email"] || null,
              gender: r["gender"] || null,
              userType: r["userType"] || null,
              city: r["city"] || null,
            };

            let userDoc = null;
            if (userPayload.email) {
              userDoc = await User.findOneAndUpdate(
                { email: userPayload.email },
                userPayload,
                { upsert: true, new: true }
              );
            } else if (userPayload.firstName && userPayload.phone) {
              userDoc = await User.findOneAndUpdate(
                { firstName: userPayload.firstName, phone: userPayload.phone },
                userPayload,
                { upsert: true, new: true }
              );
            }

            // ===== ACCOUNT =====
            let accountDoc = null;
            if (r["account_name"] && userDoc) {
              accountDoc = await Account.findOneAndUpdate(
                { accountName: r["account_name"], userId: userDoc._id },
                {
                  accountName: r["account_name"],
                  account_type: r["account_type"] || null,
                  userId: userDoc._id,
                },
                { upsert: true, new: true }
              );
            }

            // ===== LOB =====
            let lobDoc = null;
            if (r["category_name"]) {
              lobDoc = await Lob.findOneAndUpdate(
                { category_name: r["category_name"] },
                { category_name: r["category_name"] },
                { upsert: true, new: true }
              );
            }

            // ===== CARRIER =====
            let carrierDoc = null;
            if (r["company_name"]) {
              carrierDoc = await Carrier.findOneAndUpdate(
                { company_name: r["company_name"] },
                { company_name: r["company_name"] },
                { upsert: true, new: true }
              );
            }

            // ===== POLICY =====
            if (r["policy_number"]) {
              await Policy.findOneAndUpdate(
                { policy_number: r["policy_number"] },
                {
                  policy_number: r["policy_number"],
                  start_date: r["policy_start_date"]
                    ? new Date(r["policy_start_date"])
                    : null,
                  end_date: r["policy_end_date"]
                    ? new Date(r["policy_end_date"])
                    : null,
                  lob_collection_id: lobDoc?._id || null,
                  carrier_collection_id: carrierDoc?._id || null,
                  user_id: userDoc?._id || null,
                  policy_mode: r["policy_mode"] || null,
                  policy_type: r["policy_type"] || null,
                  premium_amount_written: r["premium_amount_written"] || null,
                  premium_amount: r["premium_amount"] || null,
                  producer: r["producer"] || null,
                  csr: r["csr"] || null,
                  agency_id: r["agency_id"] || null,
                  hasActiveClientPolicy: r["hasActive ClientPolicy"] || null,
                },
                { upsert: true, new: true }
              );
            }

            inserted++;
          } catch (err) {
            parentPort.postMessage({ type: "error", error: err.message });
            // console.error("Row processing error:", err.message);
          }
        }

        // resolve({ status: "success", inserted });
        resolve({ type: "done", results: { status: "success", inserted } });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

// Worker execution
(async () => {
  try {
    const result = await processFile(workerData.filePath);
    parentPort.postMessage(result);
  } catch (err) {
    parentPort.postMessage({ status: "error", message: err.message });
  } finally {
    // mongoose.connection.close();
  }
})();