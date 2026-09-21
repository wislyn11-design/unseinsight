import { getTransitSinsal } from "./sinsal.js";

function natalFromChart(chart, gender) {
  return {
    yearGan: chart?.year?.gan,
    yearJi: chart?.year?.ji,
    monthGan: chart?.month?.gan,
    monthJi: chart?.month?.ji,
    dayGan: chart?.day?.gan,
    dayJi: chart?.day?.ji,
    hourGan: chart?.hour?.gan,
    hourJi: chart?.hour?.ji,
    gender: gender || chart?.gender || "",
  };
}

export function getTransitSinsalResult(chart, target, gender) {
  if (!chart || !target?.gan || !target?.ji) {
    return {
      version: "",
      target: "",
      items: [],
      warnings: [],
    };
  }

  return getTransitSinsal(natalFromChart(chart, gender), target);
}

export function getTransitSinsalNames(chart, target, gender) {
  const result = getTransitSinsalResult(chart, target, gender);
  return [...new Set((result.items || []).map((item) => item.name).filter(Boolean))];
}

export function enrichDaeunSinsal(chart, gender) {
  if (!chart) return chart;

  const resolvedGender = gender || chart.gender || "";
  const daeun = chart.daeun;

  if (!daeun || !Array.isArray(daeun.daeuns)) {
    return {
      ...chart,
      gender: resolvedGender,
    };
  }

  return {
    ...chart,
    gender: resolvedGender,
    daeun: {
      ...daeun,
      daeuns: daeun.daeuns.map((item) => {
        const result = getTransitSinsalResult(
          chart,
          { gan: item.gan, ji: item.ji, type: "daeun" },
          resolvedGender,
        );

        return {
          ...item,
          sinsal: [
            ...new Set(
              (result.items || []).map((sinsalItem) => sinsalItem.name).filter(Boolean),
            ),
          ],
          sinsalDetails: result.items || [],
          sinsalVersion: result.version || "",
          sinsalWarnings: result.warnings || [],
        };
      }),
    },
  };
}
