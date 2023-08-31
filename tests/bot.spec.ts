import { test } from "@playwright/test";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

test("Let me timesheet that for you!", async ({ page }) => {
  const { domain = "", password = "", user = "" } = process.env;

  await page.goto(`https://${domain}.oncoreservices.com/Pages/Login.aspx`);

  await page.getByLabel("User Name").type(user);
  await page.getByLabel("Password").type(password);
  await page.locator('[type="submit"]').click();

  await page.waitForURL(/oncoreservices.com\/pages\/ContractorSummary.aspx/);

  await page.getByText(/Edit current timesheet/).click();
  await page.waitForURL(/oncoreservices.com\/pages\/TimesheetSubmit.aspx/);

  let currentDate = dayjs().utc(true).startOf("M");

  while (!currentDate.isAfter(currentDate.endOf("M"))) {
    const dayOfWeek = currentDate.get("d");
    const date = currentDate.format("dddd, MMMM DD, YYYY");

    console.log(`Date is ${date}`);

    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      await page.getByTitle(/Add new timesheet entry/).click();

      const modal = page.locator(".rgEditForm");

      modal.locator(".expenseHeader").getByText("Timesheet Entry").waitFor({
        state: "visible",
      });

      await modal
        .locator("[id='ctl00_MainContent_TimesheetWorkGrid_ctl00_ctl02_ctl02_EditFormControl_radTxtUnits']")
        .type("8");

      await modal
        .locator("[id='ctl00_MainContent_TimesheetWorkGrid_ctl00_ctl02_ctl02_EditFormControl_ddlRate']")
        .selectOption("Standard Hour (Hour)");

      await modal.getByTitle(/Open the calendar popup./).click();
      await page.getByTitle(date).click();
      await modal.getByText("Insert").click();
    }

    currentDate = currentDate.add(1, "day");
  }

  await page.waitForEvent("load");
});
