import { Suspense } from "react";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { Edition } from "@/lib/edition/types";
import PrintEdition from "@/components/edition/PrintEdition";
import { verifyPrintToken } from "@/lib/pdf/token";

export const instant = false;

interface PrintPageProps {
  params: Promise<{
    editionId: string;
  }>;
  searchParams: Promise<{
    token?: string;
  }>;
}

async function PrintPageContent({ params, searchParams }: PrintPageProps) {
  const { editionId } = await params;
  const { token } = await searchParams;

  if (!editionId || !verifyPrintToken(editionId, token)) {
    notFound();
  }

  const { data: editionRecord, error } = await supabaseAdmin
    .from("editions")
    .select("id, layout_json")
    .eq("id", editionId)
    .maybeSingle();

  if (error || !editionRecord || !editionRecord.layout_json) {
    notFound();
  }

  const edition = editionRecord.layout_json as Edition;

  return <PrintEdition edition={edition} />;
}

export default function PrintPage(props: PrintPageProps) {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "20mm", fontFamily: "serif", color: "#6B655C" }}>
          Loading printable edition...
        </div>
      }
    >
      <PrintPageContent
        params={props.params}
        searchParams={props.searchParams}
      />
    </Suspense>
  );
}
