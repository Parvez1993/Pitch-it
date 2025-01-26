import { Search } from "lucide-react";
import Form from "next/form";
import SearchReset from "./search-reset";
function SearchForm({ query }: { query?: string }) {
  return (
    <Form action="/" className="search-form">
      <input
        name="query"
        defaultValue={query}
        className="search-input"
        placeholder="Search Startups"
      />
      <div className="flex gap-2">
        {query && <SearchReset />}

        <button type="submit" className="search-btn text-white">
          <Search className="size-5" />
        </button>
      </div>
    </Form>
  );
}

export default SearchForm;
