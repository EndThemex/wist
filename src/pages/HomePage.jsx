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
import "./HomePage.css";

export default function HomePage() {
  const items = useCatalogStore((s) => s.items);
  const groups = useCatalogStore((s) => s.groups);
  const categories = useCatalogStore((s) => s.categories);
  const tags = useCatalogStore((s) => s.tags);

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
            WHERE IS IT? · 你的私人物品账本
          </div>
          <h1 className="home-title">
            <span className="home-title-line">Where Is It?</span>
            <span className="home-title-line home-title-emph">
              记下每件物品，时隔再久也不丢。
            </span>
          </h1>
          <p className="home-lede">
            把身边的物品逐条记进浏览器：名称、位置、价格、标签、图片。
            三个月、一年、五年后忘记自己是否买过、放在哪里——打开
            <em> Where Is It? </em>
            搜一搜就知道它是否已经存在、它被安放在了哪里。
          </p>

          <div className="home-cta">
            <Link to={newItemLink()} className="btn home-cta-primary">
              <Plus size={16} strokeWidth={1.75} aria-hidden />
              &nbsp;记录第一件物品
            </Link>
            <Link to="/stats" className="btn btn-ghost">
              查看统计
              <ArrowRight size={14} strokeWidth={1.5} aria-hidden />
            </Link>
          </div>
        </div>

        {/* 右侧 mock 列表：用纯几何/文字拼一张“清单样张”，不依赖外链图 */}
        <aside className="home-hero-card" aria-hidden>
          <div className="home-hero-card-head">
            <span className="mono">SAMPLE · INVENTORY</span>
            <span className="mono subtle">/ 04</span>
          </div>
          <ul className="home-hero-list">
            <SampleRow
              icon={<Box size={14} strokeWidth={1.5} />}
              name="机械键盘"
              meta="书房 · 桌面"
              tag="#办公"
            />
            <SampleRow
              icon={<Camera size={14} strokeWidth={1.5} />}
              name="微单相机"
              meta="玄关 · 抽屉"
              tag="#摄影"
            />
            <SampleRow
              icon={<MapPin size={14} strokeWidth={1.5} />}
              name="护照"
              meta="主卧 · 保险柜"
              tag="#证件"
            />
            <SampleRow
              icon={<Box size={14} strokeWidth={1.5} />}
              name="充电宝"
              meta="背包 · 内袋"
              tag="#出行"
            />
          </ul>
          <div className="home-hero-card-foot mono subtle">
            — 查询：「键盘」已存在 · 位于「书房 · 桌面」
          </div>
        </aside>
      </section>

      {/* ===== 能力四宫格：网站核心特点 ===== */}
      <section className="home-features" aria-label="核心特点">
        <Feature
          icon={<Search size={16} strokeWidth={1.5} />}
          index="01"
          title="查重 · 防重复购买"
          desc="下次想买东西前先搜一搜，避免重复下单；长时间没想起的物品也能快速确认是否已经存在。"
        />
        <Feature
          icon={<MapPin size={16} strokeWidth={1.5} />}
          index="02"
          title="记位置 · 快速找回"
          desc="为每件物品标注存放位置。哪怕时隔多年搬家、收纳变更，也能依据记录一步步顺藤摸瓜。"
        />
        <Feature
          icon={<TagIcon size={16} strokeWidth={1.5} />}
          index="03"
          title="多维组织"
          desc="用分组、分类、标签三套维度灵活归类，按场景或按用途都能一眼看清家底。"
        />
        <Feature
          icon={<HardDrive size={16} strokeWidth={1.5} />}
          index="04"
          title="本地优先"
          desc="所有记录保存在浏览器本地，不上传服务器。属于个人的物品账本，只有自己能翻阅。"
        />
      </section>

      {/* ===== 三步上手：体现网站特点功能 ===== */}
      <section className="home-steps" aria-label="三步上手">
        <header className="section-head">
          <h2>三步把物品存进账本</h2>
          <span className="mono subtle">GET STARTED IN 3 STEPS</span>
        </header>
        <ol className="home-steps-list">
          <Step
            n={1}
            title="逐条记录每一件物品"
            desc="点击「记录第一件物品」，填写名称、位置、价格、标签，必要时附上照片——所有字段都可选，只有名称必填。"
          />
          <Step
            n={2}
            title="用位置与标签归类"
            desc="位置字段是「它在哪」，标签是「它是什么」；位置 + 标签组合起来，就是未来找回它的钥匙。"
          />
          <Step
            n={3}
            title="搜索 · 确认是否已存在"
            desc="再次想起某件物品时，回到首页输入关键词搜索：如果清单里已有，说明它已经存在，点开就能看到图片与位置。"
          />
        </ol>
      </section>

      {/* ===== 数据规模提示：让用户一眼看清当前状态 ===== */}
      <section className="home-meta" aria-label="数据状态">
        <MetaCell
          label="已记录物品"
          value={items.length}
          hint="点击下方 + 开始第一条"
        />
        <MetaCell
          label="分组"
          value={groups.length}
          hint="管理入口 /groups"
          to="/groups"
        />
        <MetaCell
          label="分类"
          value={categories.length}
          hint="管理入口 /categories"
          to="/categories"
        />
        <MetaCell
          label="标签"
          value={tags.length}
          hint="管理入口 /tags"
          to="/tags"
        />
      </section>

      {/* ===== 页脚 CTA：再次强调首屏主操作 ===== */}
      <section className="home-footcta">
        <div className="home-footcta-text">
          <h3>开始你的第一件物品</h3>
          <p className="muted">
            记下来，以后忘了也能找到——这是 Where Is It? 存在的意义。
          </p>
        </div>
        <Link to={newItemLink()} className="btn home-cta-primary">
          <Plus size={16} strokeWidth={1.75} aria-hidden />
          &nbsp;记录第一件物品
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
