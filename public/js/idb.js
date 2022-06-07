// create variable to hold db connection
let db;

const request = indexedDB.open('budget_tracker', 1)

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function (event) {
    //  save reference to the database
    const db = event.target.result;

    // create an object store (table) called `new_transaction`, set it to have an auto incrementing primary key of sorts 
    db.createObjectStore('new_transaction', { autoIncrement: true });
}

// upon a successful
request.onsuccess = function (event) {
    // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
    db = event.target.result;

    if (navigator.onLine) {
        uploadTransaction();
    }
}

request.onerror = function (event) {
    console.log(event.target.errorCode);
}

// This function will be executed if we attempt to submit a new transaction and there's no internet connection

function saveRecord(record) {
    const transaction = db.transaction(['new_transaction'], 'readwrite');


    const transactionObjectStore = transaction.ObjectStore('new_transaction');

    transactionObjectStore.add(record);
}

function uploadTransaction() {

    // open a transaction on your db
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access your object store
    const transactionObjectStore = transaction.ObjectStore('new_transaction');

    // get all records from store and set to a variable
    const getAll = transactionObjectStore.getAll();

    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    // open a transaction on your db
                    const transaction = db.transaction(['new_transaction'], 'readwrite');

                    // access your object store
                    const transactionObjectStore = transaction.ObjectStore('new_transaction');

                      // clear all items in your store
                    transactionObjectStore.clear();

                    alert('All saved Transaction has been submitted!')
                })
                .catch(err => {
                    console.log(err);
                })
        }
    }
}

window.addEventListener('online', uploadTransaction);