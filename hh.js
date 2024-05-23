const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');

const SLEEP_TIME12 = 120000;
const SLEEP_TIME7 = 40000;

const withErrorHandling = (fn, handler) => {
    return async () => {
        try {
            await fn();
        } catch (error) {
            console.error(error);
            await handler();
        }
    };
};

class BasePage {
    constructor() {
        this.driver = new Builder().forBrowser('chrome').build();
        this.driver.manage().setTimeouts({ implicit: 5000 });
    }

    async goToUrl(url) {
        await this.driver.get(url);
    }

    async enterText(locator, text) {
        await this.driver.findElement(locator).sendKeys(text);
    }

    async click(locator) {
        await this.driver.findElement(locator).click();
    }

    async clickElement(locator) {
        await this.driver.wait(until.elementLocated(locator), 10000);
        await this.driver.findElement(locator).click();
    }

    async isElementPresent(locator) {
        try {
            await this.driver.wait(until.elementLocated(locator), 10000);
            return true;
        } catch (error) {
            return false;
        }
    }

    async saveScreenshot(fileName) {
        await this.driver.takeScreenshot().then((img) => {
            fs.writeFileSync(fileName, img, 'base64');
        });
    }

    async closeBrowser() {
        await this.driver.quit();
    }

    async closeModalIfPresent() {
        try {
            const modal = await this.driver.findElement(By.xpath("//div[@class='bloko-modal-overlay bloko-modal-overlay_visible']"));
            if (modal) {
                await this.clickElement(By.xpath("//div[@class='bloko-modal-close-button']"));
            }
        } catch (error) {
            // Модальное окно не найдено, ничего не делаем
        }
    }
}

class HHPage extends BasePage {
    constructor() {
        super();
        this.URL = 'https://hh.ru/';
        this.xpathSearchField = "//input[@data-qa='search-input']";
        this.xpathSearchButton = "//button[@data-qa='search-button']";
        this.xpathVacancies = "//div[@data-qa='vacancy-serp__vacancy']";
    }

    async openPage() {
        await this.goToUrl(this.URL);
    }

    async searchVacancy(keyword) {
        await this.enterText(By.xpath(this.xpathSearchField), keyword);
        await this.clickElement(By.xpath(this.xpathSearchButton));
        await this.driver.sleep(SLEEP_TIME12);
        await this.closeModalIfPresent();
        await this.driver.wait(until.elementLocated(By.xpath(this.xpathVacancies)), 30000);
        const firstVacancy = await this.driver.findElement(By.xpath(this.xpathVacancies));
        await firstVacancy.click();
    }
}

describe("HH.ru test", function () {
    this.timeout(100000);
    const hhPage = new HHPage();

    before(async () => {
        await hhPage.openPage();
    });

    after(async () => {
        await hhPage.closeBrowser();
    });

    it(
        "search vacancy",
        withErrorHandling(
            async () => {
                await hhPage.searchVacancy('QA Engineer');
            },
            async () => await hhPage.saveScreenshot("error.png"),
        )
    );
});
