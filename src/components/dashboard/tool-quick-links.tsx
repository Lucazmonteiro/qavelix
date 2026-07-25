import type { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";

type Dictionary = ReturnType<typeof getDictionary>;

type ToolQuickLinksProps = {
  locale: Locale;
  dictionary: Dictionary;
};

// Static — these two tools are the entire current tool catalog. No data source to wire
// up here; this just needs to stay easy to extend when a third tool exists.
export function ToolQuickLinks({ locale, dictionary }: ToolQuickLinksProps) {
  const copy = dictionary.dashboard.overview.tools;

  const tools = [
    {
      href: `/${locale}`,
      label: copy.videoCompressorLabel,
      description: copy.videoCompressorDescription,
    },
    {
      href: `/${locale}/tools/extract-audio`,
      label: copy.extractAudioLabel,
      description: copy.extractAudioDescription,
    },
  ];

  return (
    <div className="foundation-card">
      <h2 className="dashboard-card__title">{copy.title}</h2>
      <div className="dashboard-grid">
        {tools.map((tool) => (
          <div className="foundation-card dashboard-tool-card" key={tool.href}>
            <h3>{tool.label}</h3>
            <p>{tool.description}</p>
            <a className="button button--secondary" href={tool.href}>
              {copy.openLabel}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
