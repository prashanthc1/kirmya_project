"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { onboardingApi } from "../../features/onboarding/api";
import {
	Box,
	Typography,
	Button,
	Grid,
	Stack,
	Chip,
	Paper,
	useTheme,
} from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import CheckIcon from "@mui/icons-material/Check";
import AddIcon from "@mui/icons-material/Add";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { motion } from "framer-motion";
import { springs } from "../../theme/motion";
import GlassCard from "../landing/GlassCard";

interface StepProps {
	onNext: (data?: any) => void;
	onPrev: () => void;
}

export const CommunitiesStep: React.FC<StepProps> = ({ onNext, onPrev }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	const [joined, setJoined] = useState<{ [key: string]: boolean }>({});

	const {
		data: recommendations = [],
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["onboarding", "communities"],
		queryFn: () => onboardingApi.getRecommendedCommunities(),
	});

	const communities = recommendations.map((comm) => ({
		id: comm.id,
		name: comm.name,
		category: comm.category || "Industry Guild",
		members:
			comm.member_count === 1
				? "1 member"
				: `${(comm.member_count || 0).toLocaleString()} members`,
		isJoined: comm.is_joined,
	}));

	const toggleJoin = (id: string) => {
		setJoined((prev) => ({
			...prev,
			[id]:
				prev[id] !== undefined
					? !prev[id]
					: !recommendations.find((c) => c.id === id)?.is_joined,
		}));
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 20 }}
			transition={springs.entrance}
		>
			<GlassCard sx={{ p: { xs: 3, md: 5 } }}>
				<Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
					Recommended Communities
				</Typography>
				<Typography
					variant="body2"
					color="text.secondary"
					sx={{ mb: 4 }}
				>
					Join active industry guilds tailored to your profile for
					peer support, Q&amp;A, and referrals.
				</Typography>

				<Grid container spacing={2.5} sx={{ mb: 4 }}>
					{isLoading && (
						<Typography
							variant="body2"
							color="text.secondary"
							role="status"
							aria-live="polite"
						>
							Finding communities for you…
						</Typography>
					)}

					{isError && !isLoading && (
						<Typography variant="body2" color="text.secondary">
							Communities could not be loaded. You can skip this
							and join guilds later.
						</Typography>
					)}

					{!isLoading && !isError && communities.length === 0 && (
						<Typography variant="body2" color="text.secondary">
							No recommended communities yet. As new guilds are
							created, you will see them here.
						</Typography>
					)}

					{communities.map((comm) => {
						const isJ =
							joined[comm.id] !== undefined
								? joined[comm.id]
								: comm.isJoined;
						return (
							<Grid item xs={12} sm={6} key={comm.id}>
								<Paper
									elevation={0}
									sx={{
										p: 2.5,
										borderRadius: "16px",
										bgcolor: isDark
											? "rgba(30, 41, 59, 0.7)"
											: "rgba(241, 245, 249, 0.8)",
										border: "1px solid rgba(255, 255, 255, 0.1)",
										height: "100%",
										display: "flex",
										flexDirection: "column",
										justifyContent: "space-between",
									}}
								>
									<Box>
										<Stack
											direction="row"
											justifyContent="space-between"
											alignItems="center"
											sx={{ mb: 1 }}
										>
											<GroupsIcon
												sx={{ color: "primary.main" }}
											/>
											<Chip
												label={comm.category}
												size="small"
												variant="outlined"
												sx={{ fontSize: "0.7rem" }}
											/>
										</Stack>
										<Typography
											variant="subtitle1"
											sx={{
												fontWeight: 800,
												mb: 0.5,
												lineHeight: 1.3,
											}}
										>
											{comm.name}
										</Typography>
										<Typography
											variant="caption"
											color="text.secondary"
										>
											{comm.members}
										</Typography>
									</Box>

									<Button
										size="small"
										variant={isJ ? "contained" : "outlined"}
										color={isJ ? "success" : "primary"}
										startIcon={
											isJ ? <CheckIcon /> : <AddIcon />
										}
										onClick={() => toggleJoin(comm.id)}
										sx={{
											mt: 2,
											borderRadius: "10px",
											textTransform: "none",
											fontWeight: 700,
										}}
									>
										{isJ ? "Joined" : "Join Guild"}
									</Button>
								</Paper>
							</Grid>
						);
					})}
				</Grid>

				<Stack direction="row" justifyContent="space-between">
					<Button
						variant="text"
						onClick={onPrev}
						startIcon={<ArrowBackIcon />}
						sx={{ fontWeight: 700 }}
					>
						Back
					</Button>
					<Stack direction="row" spacing={2}>
						<Button
							variant="text"
							onClick={() => onNext()}
							sx={{ fontWeight: 700, color: "text.secondary" }}
						>
							Skip
						</Button>
						<Button
							variant="contained"
							onClick={() =>
								onNext({
									joinedCommunities: Object.keys(
										joined,
									).filter((k) => joined[k]),
								})
							}
							endIcon={<ArrowForwardIcon />}
							sx={{
								py: 1.2,
								px: 3.5,
								borderRadius: "12px",
								fontWeight: 800,
								textTransform: "none",
							}}
						>
							Continue
						</Button>
					</Stack>
				</Stack>
			</GlassCard>
		</motion.div>
	);
};

export default CommunitiesStep;
