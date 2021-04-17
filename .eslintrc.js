module.exports = {
  "extends": "standard",
  "rules": {
    "semi": [2, "always"],
    "indent": "off",
    "no-unused-expressions": 0,
    "chai-friendly/no-unused-expressions": 2
  },
  "env": { "mocha": true },
  "plugins": [
    "chai-friendly"
  ]
};
