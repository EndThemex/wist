// 首页 / 首次使用引导页
// 当用户没有任何物品时呈现：站点身份、能力概览、入门指引
// 一旦存在物品即透明降级为 ItemsListPage，保留全部检索 / 筛选能力
import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Tag as TagIcon,
  HardDrive,
  Plus,
  ArrowRight,
  Camera,
  MapPin,
  Box,
} from "lucide-react";
import { useCatalogStore } from "@/store/useCatalogStore";
import { newItemLink } from "@/lib/url";
import ItemsListPage from "@/pages/ItemsListPage.jsx";
import { useT } from "@/i18n";
import "./HomePage.css";

export default function HomePage() {
  const items = useCatalogStore((s) => s.items);
  const groups = useCatalogStore((s) => s.groups);
  const categories = useCatalogStore((s) => s.categories);
  const tags = useCatalogStore((s) => s.tags);
  const t = useT();

  // 物品为空时呈现引导首页；否则直接复用列表页（保留全部检索/筛选体验）
  const isFirstRun = useMemo(() => items.length === 0, [items.length]);

  if (!isFirstRun) return <ItemsListPage />;

  return (
    <div className="home">
      {/* ===== Hero：站点身份 + 主操作 ===== */}
      <section className="home-hero">
        <div className="home-hero-text">
          <div className="home-eyebrow mono">
            <span className="home-eyebrow-dot" aria-hidden />
            {t("home.eyebrow")}
          </div>
          <h1 className="home-title">
            <span className="home-title-line">{t("home.title.l1")}</span>
            <span className="home-title-line home-title-emph">
              {t("home.title.l2")}
            </span>
          </h1>
          <p
            className="home-lede"
            // lede 包含 {app} 占位符（用作 <em> Where Is It? </em> 的高亮）
            dangerouslySetInnerHTML={{
              __html: t("home.lede").replace(
                /\{app\}/g,
                '<em>Where Is It?</em>',
              ),
            }}
          />

          <div className="home-cta">
            <Link to={newItemLink()} className="btn home-cta-primary">
              <Plus size={16} strokeWidth={1.75} aria-hidden />
              &nbsp;{t("home.cta.primary")}
            </Link>
            <Link to="/stats" className="btn btn-ghost">
              {t("home.cta.secondary")}
              <ArrowRight size={14} strokeWidth={1.5} aria-hidden />
            </Link>
          </div>
        </div>

        {/* 右侧 mock 列表：用纯几何/文字拼一张"清单样张"，不依赖外链图 */}
        <aside className="home-hero-card" aria-hidden>
          <div className="home-hero-card-head">
            <span className="mono">{t("home.card.head")}</span>
            <span className="mono subtle">/ 04</span>
          </div>
          <ul className="home-hero-list">
            <SampleRow
              icon={<Box size={14} strokeWidth={1.5} />}
              name={t("home.sample.keyboard.name")}
              meta={t("home.sample.keyboard.meta")}
              tag={t("home.tag.office")}
            />
            <SampleRow
              icon={<Camera size={14} strokeWidth={1.5} />}
              name={t("home.sample.camera.name")}
              meta={t("home.sample.camera.meta")}
              tag={t("home.tag.photo")}
            />
            <SampleRow
              icon={<MapPin size={14} strokeWidth={1.5} />}
              name={t("home.sample.passport.name")}
              meta={t("home.sample.passport.meta")}
              tag={t("home.tag.cert")}
            />
            <SampleRow
              icon={<Box size={14} strokeWidth={1.5} />}
              name={t("home.sample.powerbank.name")}
              meta={t("home.sample.powerbank.meta")}
              tag={t("home.tag.travel")}
            />
          </ul>
          <div className="home-hero-card-foot mono subtle">
            {t("home.card.foot")}
          </div>
        </aside>
      </section>

      {/* ===== 能力四宫格：网站核心特点 ===== */}
      <section className="home-features" aria-label={t("common.search")}>
        <Feature
          icon={<Search size={16} strokeWidth={1.5} />}
          index="01"
          title={t("home.feature1.title")}
          desc={t("home.feature1.desc")}
        />
        <Feature
          icon={<MapPin size={16} strokeWidth={1.5} />}
          index="02"
          title={t("home.feature2.title")}
          desc={t("home.feature2.desc")}
        />
        <Feature
          icon={<TagIcon size={16} strokeWidth={1.5} />}
          index="03"
          title={t("home.feature3.title")}
          desc={t("home.feature3.desc")}
        />
        <Feature
          icon={<HardDrive size={16} strokeWidth={1.5} />}
          index="04"
          title={t("home.feature4.title")}
          desc={t("home.feature4.desc")}
        />
      </section>

      {/* ===== 三步上手：体现网站特点功能 ===== */}
      <section className="home-steps" aria-label={t("home.steps.title")}>
        <header className="section-head">
          <h2>{t("home.steps.title")}</h2>
          <span className="mono subtle">{t("home.steps.subtitle")}</span>
        </header>
        <ol className="home-steps-list">
          <Step
            n={1}
            title={t("home.step1.title")}
            desc={t("home.step1.desc")}
          />
          <Step
            n={2}
            title={t("home.step2.title")}
            desc={t("home.step2.desc")}
          />
          <Step
            n={3}
            title={t("home.step3.title")}
            desc={t("home.step3.desc")}
          />
        </ol>
      </section>

      {/* ===== 数据规模提示：让用户一眼看清当前状态 ===== */}
      <section className="home-meta" aria-label={t("home.meta.items")}>
        <MetaCell
          label={t("home.meta.items")}
          value={items.length}
          hint={t("home.meta.itemsHint")}
        />
        <MetaCell
          label={t("home.meta.groups")}
          value={groups.length}
          hint={t("home.meta.groupsHint")}
          to="/groups"
        />
        <MetaCell
          label={t("home.meta.categories")}
          value={categories.length}
          hint={t("home.meta.categoriesHint")}
          to="/categories"
        />
        <MetaCell
          label={t("home.meta.tags")}
          value={tags.length}
          hint={t("home.meta.tagsHint")}
          to="/tags"
        />
      </section>

      {/* ===== 页脚 CTA：再次强调首屏主操作 ===== */}
      <section className="home-footcta">
        <div className="home-footcta-text">
          <h3>{t("home.footcta.title")}</h3>
          <p className="muted">{t("home.footcta.desc")}</p>
        </div>
        <Link to={newItemLink()} className="btn home-cta-primary">
          <Plus size={16} strokeWidth={1.75} aria-hidden />
          &nbsp;{t("home.cta.primary")}
        </Link>
      </section>
    </div>
  );
}

/* ============ 子组件 ============ */

function Feature({ icon: Icon, index, title, desc }) {
  return (
    <article className="home-feature">
      <header className="home-feature-head">
        <span className="home-feature-idx mono">{index}</span>
        <span className="home-feature-icon" aria-hidden>
          {Icon}
        </span>
      </header>
      <h3 className="home-feature-title">{title}</h3>
      <p className="home-feature-desc">{desc}</p>
    </article>
  );
}

function Step({ n, title, desc }) {
  return (
    <li className="home-step">
      <div className="home-step-idx mono" aria-hidden>
        {String(n).padStart(2, "0")}
      </div>
      <div className="home-step-body">
        <h4>{title}</h4>
        <p className="muted">{desc}</p>
      </div>
    </li>
  );
}

function MetaCell({ label, value, hint, to }) {
  const inner = (
    <>
      <div className="home-meta-label mono">{label}</div>
      <div className="home-meta-value mono">
        {String(value).padStart(2, "0")}
      </div>
      {hint && <div className="home-meta-hint mono subtle">{hint}</div>}
    </>
  );
  if (to) {
    return (
      <Link to={to} className="home-meta-cell home-meta-cell-link">
        {inner}
      </Link>
    );
  }
  return <div className="home-meta-cell">{inner}</div>;
}

function SampleRow({ icon, name, meta, tag }) {
  return (
    <li className="home-hero-row">
      <span className="home-hero-row-icon" aria-hidden>
        {icon}
      </span>
      <span className="home-hero-row-name">{name}</span>
      <span className="home-hero-row-meta mono subtle">{meta}</span>
      <span className="home-hero-row-tag">{tag}</span>
    </li>
  );
}