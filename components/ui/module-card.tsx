// module-card.tsx

import React, { useState } from 'react';
import { FaLock, FaUnlock } from 'react-icons/fa';
import { Copy } from 'lucide-react';
import { getHueFromModuleCode } from '@/components/ui/colorUtils';
import styles from './module-card.module.css';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

type Module = {
  uuid: string;
  id: number;
  code: string;
  name: string;
  ects: number;
  prerequisites: string[]; // URIs of prerequisites
  prerequisiteNames: string[]; // Names of prerequisites
  prerequisiteCodes: string[]; // Codes of prerequisites
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

type ModuleCardProps = {
  module: Module;
  isSelected: boolean;
  onSelect: () => void;
  selectedModuleCodes: string[]; // Codes of modules selected up to current semester
  selectedElsewhere: boolean;
  currentSemester: number;
  allModules: Module[];
  selectedModules: string[]; // Only modules in the current semester
};

export const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  isSelected,
  onSelect,
  selectedModuleCodes,
  selectedElsewhere,
  currentSemester,
  allModules,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  /**
   * Determines if all prerequisites are fulfilled for the module.
   * Prerequisites are fulfilled if they are selected in the current semester or any prior semesters.
   * @returns True if prerequisites are fulfilled, false otherwise.
   */
  const arePrerequisitesFulfilled = (): boolean => {
    return module.prerequisiteCodes.every((prereqCode) => selectedModuleCodes.includes(prereqCode));
  };

  const prerequisitesMet = arePrerequisitesFulfilled();
  const greyedOut = selectedElsewhere || (!isSelected && !prerequisitesMet);

  /**
   * Determines the background color of the module card based on its state.
   */
  const getModuleColor = () => {
    if (isSelected) {
      const hue = getHueFromModuleCode(module.code);
      const saturation = 70;
      const lightness = 50;
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    } else if (greyedOut) {
      return `hsl(0, 0%, 85%)`; // Light grey for greyed-out modules
    } else {
      const hue = getHueFromModuleCode(module.code);
      const saturation = 70;
      const lightness = 69;
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
  };

  /**
   * Determines a darker shade of the module's color for icons and buttons.
   */
  const getDarkerModuleColor = () => {
    if (greyedOut) {
      return `hsl(0, 0%, 50%)`; // Dark grey
    }
    if (isSelected) {
      const hue = getHueFromModuleCode(module.code);
      const saturation = 70;
      const lightness = 30;
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    } else {
      const hue = getHueFromModuleCode(module.code);
      const saturation = 70;
      const lightness = 40;
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
  };

  /**
   * Extracts the module code from its URI.
   * @param uri - The module URI.
   * @returns The module code.
   */
  const extractModuleCode = (uri: string): string => {
    return uri.split('/').pop() || uri;
  };

  /**
   * Retrieves the names of the prerequisites for display.
   * @returns A string listing all prerequisite module names and codes.
   */
  const getPrerequisiteNames = (): string => {
    return module.prerequisites
      .map((prereqUri) => {
        const extractedPrereqCode = extractModuleCode(prereqUri);
        const prereqModule = allModules.find((m) => m.code === extractedPrereqCode);
        return prereqModule ? `${prereqModule.name} (${prereqModule.code})` : `Module ${extractedPrereqCode}`;
      })
      .join(', ');
  };

  return (
    <>
      <div
        onClick={() => {
          if (!greyedOut) {
            onSelect();
          }
        }}
        style={{ backgroundColor: getModuleColor() }}
        className={`p-4 rounded-md text-white flex flex-col h-full ${
          greyedOut ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:opacity-90'
        } transition-opacity duration-200 ${
          isSelected ? 'outline outline-2 outline-black outline-offset-[-2px]' : ''
        } relative ${styles.moduleCard}`}
        role="button"
        aria-pressed={isSelected}
        aria-disabled={greyedOut}
        title={
          selectedElsewhere
            ? 'This module is already selected in another semester'
            : greyedOut
            ? 'Prerequisites not met'
            : 'Click to select'
        }
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!greyedOut) {
              onSelect();
            }
          }
        }}
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

        {/* Icons */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex space-x-2">
            {selectedElsewhere && (
              <div className="p-1 rounded" style={{ backgroundColor: getDarkerModuleColor() }}>
                <Copy className="text-white" size={16} aria-label="Already selected in another semester" />
              </div>
            )}
            {module.prerequisites.length > 0 && (
              <div className="p-1 rounded" style={{ backgroundColor: getDarkerModuleColor() }}>
                {prerequisitesMet ? (
                  <FaUnlock className="text-white" title="Prerequisites met" />
                ) : (
                  <FaLock className="text-white" title="Prerequisites not met" />
                )}
              </div>
            )}
          </div>

          {/* Details Button */}
          <button
            className="px-3 py-1 rounded transition"
            style={{
              backgroundColor: getDarkerModuleColor(),
              color: 'white',
              cursor: 'pointer',
            }}
            onClick={(e) => {
              e.stopPropagation();
              setIsDialogOpen(true);
            }}
            title="View module details"
            aria-label={`View details for ${module.name}`}
          >
            Details
          </button>
        </div>
      </div>

      {/* Dialog for Module Details */}
      {isDialogOpen && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-white shadow-lg rounded-lg">
            <DialogHeader>
              <DialogTitle>{module.name} Details</DialogTitle>
              <DialogDescription>
                <p>
                  <strong>Code:</strong> {module.code}
                </p>
                <p>
                  <strong>ECTS:</strong> {module.ects}
                </p>
                {/* Display prerequisites with codes */}
                {module.prerequisites.length > 0 && (
                  <p>
                    <strong>Prerequisites:</strong> {getPrerequisiteNames()}
                  </p>
                )}
                {/* Additional fields */}
                {module.examDistribution && module.examDistribution.length > 0 && (
                  <p>
                    <strong>Exam Distribution:</strong> {module.examDistribution.join(', ')}
                  </p>
                )}
                {module.examDuration && module.examDuration.length > 0 && (
                  <p>
                    <strong>Exam Duration:</strong> {module.examDuration.join(', ')} minutes
                  </p>
                )}
                {module.assessmentForm && module.assessmentForm.length > 0 && (
                  <p>
                    <strong>Assessment Form:</strong> {module.assessmentForm.join(', ')}
                  </p>
                )}
                {module.offeredIn && module.offeredIn.length > 0 && (
                  <p>
                    <strong>Offered In:</strong> {module.offeredIn.join(', ')}
                  </p>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
