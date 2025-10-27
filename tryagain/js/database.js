// database.js - IndexedDB manager for local storage
export class DatabaseManager {
    constructor() {
        this.db = null;
        this.dbName = 'XRMemoryAssistant';
        this.version = 1;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('Database failed to open');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database opened successfully');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create persons store
                if (!db.objectStoreNames.contains('persons')) {
                    const personStore = db.createObjectStore('persons', { keyPath: 'id', autoIncrement: true });
                    personStore.createIndex('timestamp', 'timestamp', { unique: false });
                    personStore.createIndex('name', 'name', { unique: false });
                    personStore.createIndex('lastSeen', 'lastSeen', { unique: false });
                }

                console.log('Database setup complete');
            };
        });
    }

    async addPerson(personData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['persons'], 'readwrite');
            const store = transaction.objectStore('persons');
            
            const person = {
                ...personData,
                timestamp: Date.now(),
                lastSeen: Date.now(),
                encounters: 1,
                locations: [personData.location || 'Unknown'],
                tags: [],
                notes: '',
                conversationHistory: []
            };

            const request = store.add(person);

            request.onsuccess = () => {
                console.log('Person added to database:', request.result);
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('Error adding person:', request.error);
                reject(request.error);
            };
        });
    }

    async updatePerson(personId, updates) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['persons'], 'readwrite');
            const store = transaction.objectStore('persons');
            
            const getRequest = store.get(personId);
            
            getRequest.onsuccess = () => {
                const person = getRequest.result;
                if (!person) {
                    reject(new Error('Person not found'));
                    return;
                }

                // Update person data
                Object.assign(person, updates);
                person.lastSeen = Date.now();

                const updateRequest = store.put(person);
                
                updateRequest.onsuccess = () => {
                    console.log('Person updated:', personId);
                    resolve(person);
                };

                updateRequest.onerror = () => {
                    reject(updateRequest.error);
                };
            };

            getRequest.onerror = () => {
                reject(getRequest.error);
            };
        });
    }

    async incrementEncounter(personId, location) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['persons'], 'readwrite');
            const store = transaction.objectStore('persons');
            
            const getRequest = store.get(personId);
            
            getRequest.onsuccess = () => {
                const person = getRequest.result;
                if (!person) {
                    reject(new Error('Person not found'));
                    return;
                }

                person.encounters = (person.encounters || 0) + 1;
                person.lastSeen = Date.now();
                
                if (location && !person.locations.includes(location)) {
                    person.locations.push(location);
                }

                const updateRequest = store.put(person);
                
                updateRequest.onsuccess = () => {
                    resolve(person);
                };

                updateRequest.onerror = () => {
                    reject(updateRequest.error);
                };
            };

            getRequest.onerror = () => {
                reject(getRequest.error);
            };
        });
    }

    async getAllPersons() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['persons'], 'readonly');
            const store = transaction.objectStore('persons');
            const request = store.getAll();

            request.onsuccess = () => {
                // Sort by last seen, newest first
                const persons = request.result.sort((a, b) => b.lastSeen - a.lastSeen);
                resolve(persons);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async getPersonById(personId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['persons'], 'readonly');
            const store = transaction.objectStore('persons');
            const request = store.get(personId);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async deletePerson(personId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['persons'], 'readwrite');
            const store = transaction.objectStore('persons');
            const request = store.delete(personId);

            request.onsuccess = () => {
                console.log('Person deleted:', personId);
                resolve();
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async addConversation(personId, conversation) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['persons'], 'readwrite');
            const store = transaction.objectStore('persons');
            
            const getRequest = store.get(personId);
            
            getRequest.onsuccess = () => {
                const person = getRequest.result;
                if (!person) {
                    reject(new Error('Person not found'));
                    return;
                }

                if (!person.conversationHistory) {
                    person.conversationHistory = [];
                }

                person.conversationHistory.push({
                    timestamp: Date.now(),
                    content: conversation
                });

                const updateRequest = store.put(person);
                
                updateRequest.onsuccess = () => {
                    resolve(person);
                };

                updateRequest.onerror = () => {
                    reject(updateRequest.error);
                };
            };

            getRequest.onerror = () => {
                reject(getRequest.error);
            };
        });
    }

    async searchPersons(query) {
        const allPersons = await this.getAllPersons();
        query = query.toLowerCase();
        
        return allPersons.filter(person => {
            return (person.name && person.name.toLowerCase().includes(query)) ||
                   (person.tags && person.tags.some(tag => tag.toLowerCase().includes(query))) ||
                   (person.notes && person.notes.toLowerCase().includes(query));
        });
    }
}
