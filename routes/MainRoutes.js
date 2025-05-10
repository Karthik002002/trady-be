import GoalRouter from "./GoalRouter.js";
import { HoldingsRouter } from "./HoldingsRoutes.js";
import { JournalRouter } from "./JournalRoutes.js";
import { PortfolioRouter } from "./PortfolioRoutes.js";
import { StrategyRouter } from "./StrategyRoutes.js";
import SymbolRouter from "./SymbolRoutes.js";
import TradeExecutionRouter from "./TradeExecutionRoute.js";
import { TradeRouter } from "./TradeRoutes.js";
import { UserRouter } from "./UserRoutes.js";
import { WatchlistRouter } from "./WatchList.js";

export const MainRoute = [
  { path: "/user", route: UserRouter },
  { path: "/strategy", route: StrategyRouter },
  { path: "/watchlist", route: WatchlistRouter },
  { path: "/portfolio", route: PortfolioRouter },
  { path: "/holdings", route: HoldingsRouter },
  { path: "/symbol", route: SymbolRouter },
  { path: "/journal", route: JournalRouter },
  { path: "/trade", route: TradeRouter },
  { path: "/execution", route: TradeExecutionRouter },
  { path: "/goal", route: GoalRouter },
];
