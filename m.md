Listed directory NewForm-cb
Listed directory Backend
Viewed server.js:1-135
Viewed db.js:1-50
Viewed registrationRoutes.js:1-39
Viewed registrationController.js:1-561
Viewed Registration.js:1-155
Listed directory middleware
Listed directory src
Listed directory pages
Searched for "disabled"
Searched for "submit"
Viewed Register.jsx:1-100
Searched for "isSubmitting"
Searched for "isSubmitting"
Viewed Register.jsx:200-300
Viewed Register.jsx:301-350
Viewed Register.jsx:760-790
Viewed Register.jsx:1015-1045
Searched for "maxTimeMS"
Viewed package.json:1-28
Searched for "rateLimit"
Viewed master_test_suite.mjs:1-60
Viewed TeamPayment.jsx:40-100
Viewed TeamPayment.jsx:680-715
Viewed client.js:1-248

Here is an analysis of your current codebase ([`Backend`](file:///c:/Users/K%20Jayanth/OneDrive/Desktop/Semi-Main-Projects/NewForm-cb/Backend) and [`Frontend`](file:///c:/Users/K%20Jayanth/OneDrive/Desktop/Semi-Main-Projects/NewForm-cb/Frontend)) regarding the 3 concurrency protection strategies and rate limiting:

---

### Summary Checklist

| Strategy | Status | Current Reality in Your Code |
| :--- | :---: | :--- |
| **1. Frontend Disabling & Debouncing** | **Partially Present** | Button disabling with spinner exists, but **no debounce** or click-guard check exists. Rapid double-clicks can still fire multiple requests. |
| **2. Backend In-Memory Mutex/Lock** | ❌ **Missing** | No `Set` or `Map` mutex on `registerNumber`. Duplicate requests hit MongoDB directly. |
| **3. Short Database Timeouts (`maxTimeMS`)** | ❌ **Missing** | No query-level timeout (`maxTimeMS`). `socketTimeoutMS` is set to 45 seconds. |
| **4. Rate Limiting Middleware** | ❌ **Missing** | `express-rate-limit` is not installed or configured. |

---

### Detailed Breakdown

#### 1. Frontend Disabling & Debouncing
* **What you have:**
  * In [`Register.jsx`](file:///c:/Users/K%20Jayanth/OneDrive/Desktop/Semi-Main-Projects/NewForm-cb/Frontend/src/pages/Register.jsx#L97):
    * `isSubmitting` state is toggled during registration ([Line 217](file:///c:/Users/K%20Jayanth/OneDrive/Desktop/Semi-Main-Projects/NewForm-cb/Frontend/src/pages/Register.jsx#L217)) and payment ([Line 312](file:///c:/Users/K%20Jayanth/OneDrive/Desktop/Semi-Main-Projects/NewForm-cb/Frontend/src/pages/Register.jsx#L312)).
    * The main form submit button ([Line 773](file:///c:/Users/K%20Jayanth/OneDrive/Desktop/Semi-Main-Projects/NewForm-cb/Frontend/src/pages/Register.jsx#L773)) and modal confirm button ([Line 1027](file:///c:/Users/K%20Jayanth/OneDrive/Desktop/Semi-Main-Projects/NewForm-cb/Frontend/src/pages/Register.jsx#L1027)) have `disabled={isSubmitting}` and render a loading spinner.
    * Same in [`TeamPayment.jsx`](file:///c:/Users/K%20Jayanth/OneDrive/Desktop/Semi-Main-Projects/NewForm-cb/Frontend/src/pages/TeamPayment.jsx#L692) using `isSubmittingPayment`.
* **What is missing:**
  * **No function-level guard**: In [`executeRegistrationSubmit`](file:///c:/Users/K%20Jayanth/OneDrive/Desktop/Semi-Main-Projects/NewForm-cb/Frontend/src/pages/Register.jsx#L215-L218), there is no `if (isSubmitting) return;` guard at the top.
  * **Modal unmount quirk**: Clicking "Confirm & Pay" calls `setShowConfirmModal(false)` *synchronously* on the first line before awaiting the async API call, removing the modal before React disables the button.
  * **No debouncing**: If a student clicks twice within 100ms on a laggy phone before React re-renders, two API requests are dispatched simultaneously.

---

#### 2. In-Memory Request Mutex/Lock (Backend Level)
* **What is missing:**
  * In [`registrationController.js`](file:///c:/Users/K%20Jayanth/OneDrive/Desktop/Semi-Main-Projects/NewForm-cb/Backend/controllers/registrationController.js#L81-L175), there is **no in-memory lock** (`Set` or `Map`) tracking in-flight register numbers.
* **What happens right now under concurrency:**
  1. If two identical requests arrive within a few milliseconds, both pass the initial `Registration.findOne({ registerNumber })` check ([Line 127](file:///c:/Users/K%20Jayanth/OneDrive/Desktop/Semi-Main-Projects/NewForm-cb/Backend/controllers/registrationController.js#L127)) because neither record exists yet.
  2. Both run `EventSettings.findOneAndUpdate(..., { $inc: { currentRegistrations: 1 } })` ([Line 140](file:///c:/Users/K%20Jayanth/OneDrive/Desktop/Semi-Main-Projects/NewForm-cb/Backend/controllers/registrationController.js#L140)), consuming two capacity slots.
  3. Both attempt `new Registration(...).save()` ([Line 195](file:///c:/Users/K%20Jayanth/OneDrive/Desktop/Semi-Main-Projects/NewForm-cb/Backend/controllers/registrationController.js#L195)).
  4. MongoDB's unique index throws `E11000` duplicate key on the second one, which triggers your catch block rollback:
     ```javascript
     if (slotClaimed) {
       await EventSettings.updateOne({}, { $inc: { currentRegistrations: -1 } });
     }
     ```
  * While MongoDB eventually protects data integrity, both requests **hammer the database and execute extra queries/rollbacks** instead of being instantly rejected in Node.js memory.

---

#### 3. Short Database Request Timeouts (`maxTimeMS`)
* **What you have:**
  * In [`Backend/config/db.js`](file:///c:/Users/K%20Jayanth/OneDrive/Desktop/Semi-Main-Projects/NewForm-cb/Backend/config/db.js#L23-L28):
    ```javascript
    serverSelectionTimeoutMS: 15000, // 15 seconds
    socketTimeoutMS: 45000,          // 45 seconds
    ```
* **What is missing:**
  * **No `maxTimeMS`** on individual queries (e.g. `.findOne().maxTimeMS(5000)` or global Mongoose query plugin).
  * If MongoDB Atlas or Render gets swamped, queries can hang for up to **45 seconds** before socket termination, holding precious connection pool slots hostage.

---

#### 4. Rate Limiting Middleware
* In [`Backend/package.json`](file:///c:/Users/K%20Jayanth/OneDrive/Desktop/Semi-Main-Projects/NewForm-cb/Backend/package.json), `express-rate-limit` is **not installed**.
* In [`Backend/server.js`](file:///c:/Users/K%20Jayanth/OneDrive/Desktop/Semi-Main-Projects/NewForm-cb/Backend/server.js), there is no rate limiting middleware protecting the `/api/v1/registrations` endpoints from IP/subnet spam.

---

### Recommended Next Steps

If you would like to add these protections, we can implement:
1. **In-memory Mutex Set** in [`registrationController.js`](file:///c:/Users/K%20Jayanth/OneDrive/Desktop/Semi-Main-Projects/NewForm-cb/Backend/controllers/registrationController.js) for `createRegistration` and `submitPayment`.
2. **Click Guard & Immediate Disable** in [`Register.jsx`](file:///c:/Users/K%20Jayanth/OneDrive/Desktop/Semi-Main-Projects/NewForm-cb/Frontend/src/pages/Register.jsx) and [`TeamPayment.jsx`](file:///c:/Users/K%20Jayanth/OneDrive/Desktop/Semi-Main-Projects/NewForm-cb/Frontend/src/pages/TeamPayment.jsx).
3. **Mongoose `maxTimeMS`** default plugin or query timeout in [`db.js`](file:///c:/Users/K%20Jayanth/OneDrive/Desktop/Semi-Main-Projects/NewForm-cb/Backend/config/db.js).
4. **Rate limiter** using `express-rate-limit` on the registration routes.

Let me know which of these you'd like to implement first!