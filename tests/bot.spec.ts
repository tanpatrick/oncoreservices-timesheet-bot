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

  let startDate;

  if ((await page.getByText(/Submit Timesheet/).all()).length > 0) {
    startDate = dayjs().utc(true).subtract(1, "M").startOf("M");
    await page.getByText(/Submit Timesheet/).click();
  } else {
    startDate = dayjs().utc(true).startOf("M");
    await page.getByText(/Edit current timesheet/).click();
  }

  await page.waitForURL(/oncoreservices.com\/pages\/TimesheetSubmit.aspx/);

  let currentDate = startDate;

  while (!currentDate.isAfter(startDate.endOf("M"))) {
    const dayOfWeek = currentDate.get("d");
    const date = currentDate.format("dddd, MMMM DD, YYYY");

    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      console.log(`Date is ${date}`);

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
