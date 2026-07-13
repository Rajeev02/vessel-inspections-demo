import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";
import { Inspection } from "@/features/inspections/types";
import { InspectionStatus } from "@/features/inspections/constants";

interface PdfOptions {
  status: InspectionStatus;
  comments: string;
  photos: string[];
}

export const generateInspectionPdf = async (
  inspection: Inspection,
  { status, comments, photos }: PdfOptions
) => {
  const html = `
    <html>
      <body style="font-family: Helvetica; padding: 20px;">
        <h1>Inspection Report: ${inspection.vesselName}</h1>
        <hr />
        <p><strong>Status:</strong> ${status}</p>
        <p><strong>Comments:</strong> ${comments}</p>
        ${
          inspection.location
            ? `<p><strong>Location:</strong> ${inspection.location.lat}, ${inspection.location.lng}</p>`
            : ""
        }
        ${
          photos.length > 0
            ? photos
                .map(
                  (uri) =>
                    `<img src="${uri}" style="max-width: 100%; margin-top: 20px;" />`
                )
                .join("")
            : ""
        }
      </body>
    </html>
  `;
  try {
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
  } catch (e) {
    console.log("Failed to generate PDF", e);
    Alert.alert("Error", "Failed to generate or share PDF report.");
  }
};
