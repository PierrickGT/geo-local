// Shared mock data + helpers
const ENTITIES = [
  { id: '34914ecc07448efb850cb3f4e55bf31f', name: 'A1',                  type: 'Property',         created: 'Apr 15, 2026', updated: 'Apr 15, 2026', time: '11:12 PM' },
  { id: '021ccf8634a48e3891a8fa286b7683f5', name: 'Action Code',         type: 'Property',         created: 'Apr 15, 2026', updated: 'Apr 15, 2026', time: '11:12 PM' },
  { id: '06b7d73112688562b32a1209a6de5ac5', name: 'Cross Reference 5',   type: 'Entity',           created: 'Apr 15, 2026', updated: 'Apr 15, 2026', time: '11:12 PM' },
  { id: '087dd7603153830bbd4555985a73d1d8', name: 'Anesthesia Base Units', type: 'Entity',         created: 'Apr 15, 2026', updated: 'Apr 15, 2026', time: '11:12 PM' },
  { id: '08d0676c58f58daa834d4aafe3b6d618', name: 'Lab Certification 5', type: 'Entity',           created: 'Apr 15, 2026', updated: 'Apr 15, 2026', time: '11:12 PM' },
  { id: '0c5a42e1676b8ed381ad822580c445cf', name: 'OPPS Pricing Indicator', type: 'Property',      created: 'Apr 15, 2026', updated: 'Apr 15, 2026', time: '11:12 PM' },
  { id: '0fc8b071eefc8607b2bf0ea4173e03ae', name: 'Cross Reference 1',   type: 'Entity',           created: 'Apr 15, 2026', updated: 'Apr 15, 2026', time: '11:12 PM' },
  { id: '140b8c227dd48bcaa226bbc3f9eb33c6', name: 'Lab Certification 2', type: 'Entity',           created: 'Apr 15, 2026', updated: 'Apr 15, 2026', time: '11:12 PM' },
  { id: '237bc5ba011480d38a8954e1acaa8493', name: 'Lab Certification 7', type: 'Entity',           created: 'Apr 15, 2026', updated: 'Apr 15, 2026', time: '11:12 PM' },
  { id: '2bc023c5bcde8638ba753ee2645e6628', name: 'Lab Certification 1', type: 'Entity',           created: 'Apr 15, 2026', updated: 'Apr 15, 2026', time: '11:12 PM' },
  { id: '2ee00a8736de8646b65ebfebef00af6f', name: 'Date Added',          type: 'Property',         created: 'Apr 15, 2026', updated: 'Apr 15, 2026', time: '11:12 PM' },
  { id: '303c4a3c92ab8007b6085748e104314f', name: 'Cross Reference 4',   type: 'Entity',           created: 'Apr 15, 2026', updated: 'Apr 15, 2026', time: '11:12 PM' },
  { id: '47cd89a30a7a8b6eac387948a9e57d8e', name: 'ASC Payment Group',   type: 'Property',         created: 'Apr 15, 2026', updated: 'Apr 15, 2026', time: '11:12 PM' },
  { id: '556d61febf218619a9caf976bb103a86', name: 'Price Indicator 1',   type: 'Entity',           created: 'Apr 15, 2026', updated: 'Apr 15, 2026', time: '11:12 PM' },
  { id: '64e6231b889e8416857a43cf777743f0', name: 'CIM Reference 1',     type: 'Entity',           created: 'Apr 15, 2026', updated: 'Apr 15, 2026', time: '11:12 PM' },
];

const SHORT = (id) => id.slice(0,6) + '…' + id.slice(-4);

window.ENTITIES = ENTITIES;
window.SHORT = SHORT;
