// components/SearchModuleCard.tsx

import { getHueFromModuleCode } from "@/components/ui/colorUtils";
import React, { useState } from "react";
import styles from "./searchmodulecard.module.css";

type Module = {
  uuid: string;
  id: number;
  code: string;
  name: string;
  semesters: number[];
  ects: number;
  prerequisites: string[];
  prerequisiteNames: string[];
  subjectArea: string[];
  assessment?: string[];
  examDuration?: number[];
  examDistribution?: string[];
  assessmentForm?: string[];
  lecturer?: string[];
  personInCharge?: string[];
  offeredIn?: string[];
  literature?: string[];
  workloadPerson?: number[];
  workloadSelf?: number[];
  furtherModule?: string[];
  additionalPrereqList?: string[];
};

type SearchModuleCardProps = {
  module: Module;
};

export const SearchModuleCard: React.FC<SearchModuleCardProps> = ({
  module,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  /**
   * Determines the background color of the module card based on module code.
   * @param module - The module to determine color for.
   * @returns The HSL color string.
   */
  const getModuleColor = (module: Module) => {
    const hue = getHueFromModuleCode(module.code);
    const saturation = 70;
    const lightness = 60;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  /**
   * Determines a darker shade of the module's color for icons and buttons.
   * @param module - The module to determine color for.
   * @returns The darker HSL color string.
   */
  const getDarkerModuleColor = (module: Module) => {
    const hue = getHueFromModuleCode(module.code);
    const saturation = 70;
    const lightness = 40;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  return (
    <>
      <div
        style={{ backgroundColor: getModuleColor(module) }}
        className={`p-4 rounded-md text-white cursor-pointer hover:opacity-90 transition-opacity duration-200 ${styles.searchModuleCard}`}
        onClick={() => setIsDialogOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsDialogOpen(true);
          }
        }}
        title="Click to view module details"
        aria-label={`View details for ${module.name}`}
      >
        {/* Subject Areas as Small Headers (Moved to Top) */}
        {module.subjectArea && module.subjectArea.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {module.subjectArea.map((area, idx) => (
              <span
                key={idx}
                className="text-xs font-medium text-left"
                title={area}
                aria-label={`Subject Area: ${area}`}
              >
                {area}
              </span>
            ))}
          </div>
        )}

        {/* Module Details */}
        <h3 className="font-semibold">
          {module.name} ({module.code})
        </h3>
        <p className="text-sm">ECTS: {module.ects}</p>
      </div>

      {/* Dialog for Module Details */}
      {isDialogOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={() => setIsDialogOpen(false)}
        >
          <div
            className="bg-white p-6 rounded-md shadow-md w-96 max-h-full overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-4">{module.name} Details</h2>
            <div className="space-y-2">
              <p>
                <strong>Code:</strong> {module.code}
              </p>
              <p>
                <strong>ECTS:</strong> {module.ects}
              </p>
              {module.subjectArea && module.subjectArea.length > 0 && (
                <p>
                  <strong>Subject Areas:</strong>{" "}
                  {module.subjectArea.join(", ")}
                </p>
              )}
              {module.prerequisites.length > 0 && (
                <p>
                  <strong>Prerequisites:</strong>{" "}
                  {module.prerequisiteNames.join(", ")}
                </p>
              )}
              {module.assessment && module.assessment.length > 0 && (
                <p>
                  <strong>Assessment:</strong> {module.assessment.join(", ")}
                </p>
              )}
              {module.examDuration && module.examDuration.length > 0 && (
                <p>
                  <strong>Exam Duration:</strong>{" "}
                  {module.examDuration.join(", ")} minutes
                </p>
              )}
              {module.examDistribution &&
                module.examDistribution.length > 0 && (
                  <p>
                    <strong>Exam Distribution:</strong>{" "}
                    {module.examDistribution.join(", ")}
                  </p>
                )}
              {module.assessmentForm && module.assessmentForm.length > 0 && (
                <p>
                  <strong>Assessment Form:</strong>{" "}
                  {module.assessmentForm.join(", ")}
                </p>
              )}
              {module.lecturer && module.lecturer.length > 0 && (
                <p>
                  <strong>Lecturer(s):</strong> {module.lecturer.join(", ")}
                </p>
              )}
              {module.personInCharge && module.personInCharge.length > 0 && (
                <p>
                  <strong>Person in Charge:</strong>{" "}
                  {module.personInCharge.join(", ")}
                </p>
              )}
              {module.offeredIn && module.offeredIn.length > 0 && (
                <p>
                  <strong>Offered In:</strong> {module.offeredIn.join(", ")}
                </p>
              )}
              {module.literature && module.literature.length > 0 && (
                <p>
                  <strong>Recommended Literature:</strong>{" "}
                  {module.literature.join(", ")}
                </p>
              )}
              {module.workloadPerson && module.workloadPerson.length > 0 && (
                <p>
                  <strong>Workload (Person):</strong>{" "}
                  {module.workloadPerson.join(", ")} hours
                </p>
              )}
              {module.workloadSelf && module.workloadSelf.length > 0 && (
                <p>
                  <strong>Workload (Self-Study):</strong>{" "}
                  {module.workloadSelf.join(", ")} hours
                </p>
              )}
              {module.furtherModule && module.furtherModule.length > 0 && (
                <p>
                  <strong>Further Modules:</strong>{" "}
                  {module.furtherModule.join(", ")}
                </p>
              )}
              {module.additionalPrereqList &&
                module.additionalPrereqList.length > 0 && (
                  <p>
                    <strong>Additional Prerequisites:</strong>{" "}
                    {module.additionalPrereqList.join(", ")}
                  </p>
                )}
            </div>

            <button
              className="mt-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition"
              onClick={() => setIsDialogOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
