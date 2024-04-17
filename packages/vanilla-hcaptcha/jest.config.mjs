const unitConfig = {
    displayName: "unit",
    moduleDirectories: [
        "<rootDir>",
        "src",
        "node_modules"
    ],
    testEnvironment: "jsdom",
    testMatch: [
        "<rootDir>/__tests__/unit/**/*.test.js"
    ]
};

export default {
    verbose: true,
    collectCoverage: true,
    silent: false,
    projects: [
        unitConfig
    ]
};
