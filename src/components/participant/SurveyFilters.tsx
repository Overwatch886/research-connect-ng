import { Filter, Clock, DollarSign, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export type SortOption = "newest" | "reward-high" | "reward-low" | "time-short" | "time-long";
export type FilterOption = "all" | "matched" | "high-reward" | "quick" | "limited";

interface SurveyFiltersProps {
  sortBy: SortOption;
  filterBy: FilterOption;
  onSortChange: (sort: SortOption) => void;
  onFilterChange: (filter: FilterOption) => void;
}

const sortLabels: Record<SortOption, string> = {
  "newest": "Newest First",
  "reward-high": "Highest Reward",
  "reward-low": "Lowest Reward",
  "time-short": "Shortest Duration",
  "time-long": "Longest Duration",
};

const filterLabels: Record<FilterOption, string> = {
  "all": "All Surveys",
  "matched": "🎯 Matched For Me",
  "high-reward": "High Reward (₦500+)",
  "quick": "Quick (< 10 min)",
  "limited": "Limited Spots",
};

export const SurveyFilters = ({
  sortBy,
  filterBy,
  onSortChange,
  onFilterChange,
}: SurveyFiltersProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {/* Sort Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Sort: {sortLabels[sortBy]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Sort By</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
            <DropdownMenuRadioItem value="newest">
              Newest First
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="reward-high">
              <DollarSign className="h-3 w-3 mr-2" />
              Highest Reward
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="reward-low">
              <DollarSign className="h-3 w-3 mr-2" />
              Lowest Reward
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="time-short">
              <Clock className="h-3 w-3 mr-2" />
              Shortest Duration
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="time-long">
              <Clock className="h-3 w-3 mr-2" />
              Longest Duration
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Filter Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter: {filterLabels[filterBy]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Filter</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={filterBy} onValueChange={(v) => onFilterChange(v as FilterOption)}>
            <DropdownMenuRadioItem value="all">All Surveys</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="matched">🎯 Matched For Me</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="high-reward">High Reward (₦500+)</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="quick">Quick (&lt; 10 min)</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="limited">Limited Spots</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Active Filter Badge */}
      {filterBy !== "all" && (
        <Badge 
          variant="secondary" 
          className="cursor-pointer hover:bg-secondary/80"
          onClick={() => onFilterChange("all")}
        >
          {filterLabels[filterBy]} ✕
        </Badge>
      )}
    </div>
  );
};
