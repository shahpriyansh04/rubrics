import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useSession } from "next-auth/react";
import axios from "axios";

interface DownloadRubricButtonProps {
  studentId: string;
  classId: string;
}

export function DownloadRubricButton({
  studentId,
  classId,
}: DownloadRubricButtonProps) {
  const { data: session } = useSession();

  const handleDownload = async () => {
    if (!session?.user?.token) {
      console.error("No authentication token found");
      return;
    }

    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/grades/downloadRubric/${studentId}/${classId}`,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
          },
          responseType: "blob",
        }
      );

      // Create a blob from the DOCX stream
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      // Create a link element
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `rubric_${studentId}.docx`;

      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL object
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Error downloading rubric:", error);
      // You might want to show a toast notification here
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Download Rubric
    </Button>
  );
}
